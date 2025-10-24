const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const mqtt = require('mqtt');

const app = express();
app.use(cors());
app.use(express.json());

// Caché en memoria para datos en tiempo real de admin
const realTimeCache = new Map();

// Conexión a MongoDB Atlas
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://admin:Lucas2201@db-iot.zeh1ca3.mongodb.net/iot-db?retryWrites=true&w=majority';
mongoose.connect(mongoURI)
  .then(() => console.log('✓ Conectado a MongoDB Atlas'))
  .catch(err => console.error('✗ Error conectando a MongoDB:', err));

// Modelos Mongoose (esquemas simples)
const userSchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Quita auto: true (no estándar)
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'collaborator'], required: true },
  group_id: { type: Number, required: true }
});
const User = mongoose.model('users', userSchema);

const activeUserSchema = new mongoose.Schema({
  group_id: { type: Number, required: true },
  user_id: { type: Number, required: true },
  last_active: { type: Date, default: Date.now },
  login_time: { type: Date },      // Nueva: hora de inicio de sesión
  logout_time: { type: Date }      // Nueva: hora de cierre de sesión
});
activeUserSchema.index({ group_id: 1, user_id: 1 }, { unique: true });
const ActiveUser = mongoose.model('activeUsers', activeUserSchema);

const sensorReadingSchema = new mongoose.Schema({
  group_id: { type: Number, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  user_id: { type: Number }
});
const SensorReading = mongoose.model('sensorReadings', sensorReadingSchema);

const alertSchema = new mongoose.Schema({
  group_id: { type: Number, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  user_id: { type: Number }
});
const Alert = mongoose.model('alerts', alertSchema);

const shiftSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  group_id: { type: Number, required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  status: { type: String, default: 'active' }
});
const Shift = mongoose.model('shifts', shiftSchema);

const JWT_SECRET = 'your_jwt_secret_key';  // Cambia por algo seguro en prod

// Middleware para verificar el token JWT
const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Configurar MQTT Client - HiveMQ Cloud TLS
const mqttClient = mqtt.connect({
  host: '00de0513ca64463395836783057f263e.s1.eu.hivemq.cloud',
  port: 8883,
  username: 'mqttclient-abc123',  // Tus creds
  password: '@Leo2201',
  protocol: 'mqtts',  // TLS
  rejectUnauthorized: false  // Insecure para pruebas; en prod, true con CA cert
});

const topic = 'iot/daniel/tesis/sensores';  

mqttClient.on('connect', () => {
  console.log('✓ Conectado a HiveMQ Cloud');
  mqttClient.subscribe(topic, (err) => {
    if (!err) {
      console.log(`✓ Suscrito al topic: ${topic}`);
    } else {
      console.error('Error suscribiendo:', err);
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    console.log(`📨 Mensaje MQTT recibido en topic ${topic}: ${message.toString()}`);
    const data = JSON.parse(message.toString());
    const { humidity, temperature, alert, group_id } = data;

    // Validaciones básicas
    if (typeof humidity !== 'number' || typeof temperature !== 'number') {
      console.log('Error: Humedad y temperatura deben ser números');
      return;
    }
    if (!group_id || typeof group_id !== 'number') {
      console.log('Error: group_id requerido');
      return;
    }

    // Buscar colaborador activo en las últimas 12 horas (turno típico)
    const activeUsers = await ActiveUser.find({
      group_id,
      last_active: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    }).sort({ last_active: -1 });
    
    const user_id = activeUsers.length > 0 ? activeUsers[0].user_id : null;

    // Actualizar caché para admin (siempre)
    realTimeCache.set(group_id, {
      humidity,
      temperature,
      alert,
      group_id,
      timestamp: new Date().toISOString(),
      expiry: Date.now() + 60000
    });

    // **NUEVA LÓGICA**: Definir umbrales
    const TEMP_CRITICA_ALTA = 28;  // °C - productos secos/panes se dañan
    const TEMP_CRITICA_BAJA = 5;   // °C - muy frío
    const HUMEDAD_CRITICA_ALTA = 75; // % - moho/deterioro
    const HUMEDAD_CRITICA_BAJA = 30; // % - muy seco
    
    // Detectar picos altísimos (para guardar siempre)
    const isPicoAltisimo = 
      temperature > TEMP_CRITICA_ALTA || 
      temperature < TEMP_CRITICA_BAJA ||
      humidity > HUMEDAD_CRITICA_ALTA || 
      humidity < HUMEDAD_CRITICA_BAJA;

    // Detectar si hay mensaje de alerta del ESP32
    const hasAlert = alert && alert.trim() !== '';

    // **GUARDAR EN DB solo si**: hay colaborador activo Y (pico altísimo O alerta ESP32)
    if (user_id && (isPicoAltisimo || hasAlert)) {
      // Guardar lectura
      await SensorReading.create({
        group_id,
        temperature,
        humidity,
        user_id,
        timestamp: new Date()
      });
      
      console.log(`✅ Datos guardados en sensorReadings para user_id ${user_id}: Temp=${temperature}°C, Hum=${humidity}%`);

      // **GENERAR ALERTA automática si hay pico crítico** (aunque ESP32 no envíe alerta)
      if (isPicoAltisimo) {
        let alertMessage = '';
        
        if (temperature > TEMP_CRITICA_ALTA) {
          alertMessage = `⚠️ TEMPERATURA ALTA: ${temperature}°C (máx: ${TEMP_CRITICA_ALTA}°C) - Riesgo productos secos/panes`;
        } else if (temperature < TEMP_CRITICA_BAJA) {
          alertMessage = `❄️ TEMPERATURA BAJA: ${temperature}°C (mín: ${TEMP_CRITICA_BAJA}°C)`;
        } else if (humidity > HUMEDAD_CRITICA_ALTA) {
          alertMessage = `💧 HUMEDAD ALTA: ${humidity}% (máx: ${HUMEDAD_CRITICA_ALTA}%) - Riesgo de moho`;
        } else if (humidity < HUMEDAD_CRITICA_BAJA) {
          alertMessage = `🏜️ HUMEDAD BAJA: ${humidity}% (mín: ${HUMEDAD_CRITICA_BAJA}%)`;
        }

        await Alert.create({
          group_id,
          message: alertMessage,
          user_id,
          timestamp: new Date()
        });
        
        console.log(`🚨 Alerta automática generada: ${alertMessage}`);
      }
      
      // **GUARDAR alerta del ESP32** si existe
      if (hasAlert) {
        await Alert.create({
          group_id,
          message: `📡 ESP32: ${alert}`,
          user_id,
          timestamp: new Date()
        });
        console.log(`🚨 Alerta ESP32 guardada: ${alert}`);
      }
    } else if (!user_id) {
      console.log(`⚠️ No hay colaborador activo para group_id ${group_id} - Datos no guardados`);
    } else {
      console.log(`📊 Datos normales (no críticos) para group_id ${group_id}: Temp=${temperature}°C, Hum=${humidity}%`);
    }
  } catch (error) {
    console.error('Error procesando mensaje MQTT:', error.message);
  }
});

// Endpoint para actualizar usuario activo al iniciar sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Registrar usuario como activo si es colaborador
    if (user.role === 'collaborator') {
      await ActiveUser.findOneAndUpdate(
        { group_id: user.group_id, user_id: user.id },
        { 
          last_active: new Date(),
          login_time: new Date()  // Hora de inicio de sesión
        },
        { upsert: true, new: true }
      );
      console.log(`👤 Colaborador activo: ${username} (group_id: ${user.group_id}) - Sesión iniciada`);
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, group_id: user.group_id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error en login:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para logout (actualizar hora de cierre)
app.post('/logout', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'collaborator') {
      await ActiveUser.findOneAndUpdate(
        { group_id: req.user.group_id, user_id: req.user.id },
        { 
          last_active: new Date(),
          logout_time: new Date()  // Hora de cierre de sesión
        }
      );
      console.log(`👋 Colaborador cerró sesión: ${req.user.username}`);
    }
    res.json({ message: 'Sesión cerrada exitosamente' });
  } catch (error) {
    console.error('Error en logout:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});



// Endpoint para obtener el dato más reciente (en tiempo real)
app.get('/iot-data/latest', verifyToken, async (req, res) => {
  const groupId = req.user.group_id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    let query = { group_id: groupId };
    if (!isAdmin) query.user_id = userId;

    const latest = await SensorReading.findOne(query).sort({ timestamp: -1 });

    // Para admin, usar caché si no hay datos
    if (isAdmin && !latest) {
      const cachedData = realTimeCache.get(groupId);
      if (cachedData && cachedData.expiry > Date.now()) {
        console.log(`💾 Dato en caché para group_id ${groupId}:`, cachedData);
        return res.json(cachedData);
      }
    }

    if (!latest) {
      return res.status(404).json({ error: 'No se encontraron datos recientes' });
    }

    console.log(`📊 Dato reciente para group_id ${groupId}:`, latest);
    res.json(latest);
  } catch (error) {
    console.error('Error al obtener dato reciente:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para historial (adaptado a MongoDB)
app.get('/iot-data/history', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    const group_id = req.user?.group_id;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Se requieren startDate y endDate' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ error: 'Fechas inválidas' });
    }

    let query = { timestamp: { $gte: start, $lte: end } };
    if (group_id) query.group_id = parseInt(group_id, 10);

    const rows = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    console.log(`📈 Datos históricos: ${rows.length} registros para group_id ${group_id || 'all'}`);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener historial:', error.message);
    res.status(500).json({ error: 'Error al obtener historial: ' + error.message });
  }
});

// Endpoint para obtener alertas
app.get('/iot-alerts', verifyToken, async (req, res) => {
  const groupId = req.user.group_id;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    let query = { group_id: groupId };
    if (!isAdmin) query.user_id = userId;

    const alerts = await Alert.find(query).sort({ timestamp: -1 }).limit(10);
    console.log(`🚨 Alertas para group_id ${groupId}: ${alerts.length} registros`);
    res.json({ alerts });
  } catch (error) {
    console.error('Error al obtener alertas:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para obtener información del usuario
app.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id }, 'id username role group_id');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para crear turnos (solo admin)
app.post('/shift', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden crear turnos' });
  const { user_id, start_time, end_time, group_id } = req.body;
  if (!user_id || !start_time || !end_time || !group_id) {
    return res.status(400).json({ error: 'user_id, start_time, end_time y group_id son requeridos' });
  }
  try {
    await Shift.create({
      user_id,
      group_id,
      start_time: new Date(start_time),
      end_time: new Date(end_time)
    });
    console.log(`🕒 Turno creado para user_id ${user_id} en group_id ${group_id}`);
    res.status(200).json({ message: 'Turno creado exitosamente' });
  } catch (error) {
    console.error('Error al crear turno:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para obtener turnos (solo admin)
app.get('/shifts/:user_id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden ver turnos' });
  const { user_id } = req.params;
  try {
    const shifts = await Shift.find({ user_id });
    console.log(`📅 Turnos para user_id ${user_id}: ${shifts.length} registros`);
    res.json(shifts);
  } catch (error) {
    console.error('Error al obtener turnos:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para desempeño (solo admin)
app.get('/user/:user_id/performance', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden ver desempeño' });
  const { user_id } = req.params;
  try {
    const shifts = await Shift.find({ user_id, status: 'active' });
    const alerts = await Alert.find({ user_id }).sort({ timestamp: -1 }).limit(20);  // Últimas 20 alertas
    console.log(`📊 Desempeño para user_id ${user_id}: ${alerts.length} alertas en turnos activos`);
    res.json({ shifts, alerts });
  } catch (error) {
    console.error('Error al obtener desempeño:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para listar usuarios (solo admin)
app.get('/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden ver usuarios' });
  try {
    const users = await User.find({}, 'id username role group_id').sort({ id: 1 });
    console.log(`👥 Usuarios totales: ${users.length}`);
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para eliminar usuario (solo admin)
app.delete('/user/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden eliminar usuarios' });
  const { id } = req.params;
  try {
    const deleted = await User.deleteOne({ id });
    if (deleted.deletedCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.log(`🗑️ Usuario eliminado: id ${id}`);
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para actualizar usuario (solo admin)
app.put('/user/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores pueden actualizar usuarios' });
  const { id } = req.params;
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username es requerido' });
  }
  try {
    const update = { username };
    if (password) update.password = await bcrypt.hash(password, 10);
    const updated = await User.findOneAndUpdate({ id }, update, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.log(`✏️ Usuario actualizado: id ${id}, username ${username}`);
    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

// Endpoint para obtener último acceso de usuario activo
app.get('/active-users/:user_id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  
  try {
    const { user_id } = req.params;
    const activeUser = await ActiveUser.findOne({ user_id: parseInt(user_id) })
      .sort({ last_active: -1 });
    
    if (!activeUser) {
      return res.status(404).json({ error: 'Usuario no activo' });
    }
    
    res.json(activeUser);
  } catch (error) {
    console.error('Error al obtener usuario activo:', error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.post('/add-user', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden agregar usuarios' });
  }

  const { username, password, role = 'collaborator', group_id = 1 } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username y password son requeridos' });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'El username debe tener al menos 3 caracteres' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    // Obtener el siguiente ID disponible
    const lastUser = await User.findOne().sort({ id: -1 });
    const newId = lastUser ? lastUser.id + 1 : 1;

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    await User.create({
      id: newId,
      username,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'collaborator',
      group_id: parseInt(group_id, 10)
    });

    console.log(`✅ Usuario creado: ${username} (ID: ${newId}, Grupo: ${group_id}, Rol: ${role})`);
    
    res.status(201).json({ 
      message: `Colaborador ${username} agregado exitosamente al Grupo ${group_id}` 
    });
  } catch (error) {
    console.error('Error al agregar usuario:', error.message);
    res.status(500).json({ error: 'Error del servidor', details: error.message });
  }
});

app.get('/debug/users-groups', verifyToken, async (req, res) => {
  try {
    const users = await User.find({}, 'id username role group_id');
    const activeUsers = await ActiveUser.find({});
    
    res.json({
      users: users,
      activeUsers: activeUsers,
      espConfig: { group_id: 1 } // El group_id actual del ESP32
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(5000, () => {
  console.log('Servidor corriendo en http://192.168.0.106:5000');
  console.log('Listo para recibir MQTT en topic: iot/daniel/tesis/sensores');
});