const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Caché en memoria para datos en tiempo real de admin
const realTimeCache = new Map();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db-iot.c03ysss4e1gx.us-east-1.rds.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'Lucas2201',
    database: process.env.DB_NAME || 'dbiot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const JWT_SECRET = 'your_jwt_secret_key';

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

// Endpoint para actualizar usuario activo al iniciar sesión
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        connection.release();

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
        }

        // Registrar usuario como activo si es colaborador
        if (user.role === 'collaborator') {
            await pool.execute(
                'INSERT INTO active_users (group_id, user_id, last_active) VALUES (?, ?, CONVERT_TZ(NOW(), "UTC", "America/Bogota")) ' +
                'ON DUPLICATE KEY UPDATE user_id = ?, last_active = CONVERT_TZ(NOW(), "UTC", "America/Bogota")',
                [user.group_id, user.id, user.id]
            );
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role, group_id: user.group_id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error en login:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});


// Endpoint para recibir datos del sensor (sin autenticación)
app.post('/iot-data', async (req, res) => {
    const { humidity, temperature, alert, group_id } = req.body;

    if (typeof humidity !== 'number' || typeof temperature !== 'number') {
        return res.status(400).json({ error: 'La humedad y la temperatura deben ser números' });
    }
    if (!group_id || typeof group_id !== 'number') {
        return res.status(400).json({ error: 'group_id es requerido y debe ser un número' });
    }

    try {
        const connection = await pool.getConnection();

        // Buscar usuario activo (colaborador) para el group_id
        const [activeUsers] = await connection.execute(
            'SELECT user_id FROM active_users WHERE group_id = ? AND last_active >= CONVERT_TZ(NOW(), "UTC", "America/Bogota") - INTERVAL 1 HOUR',
            [group_id]
        );
        const user_id = activeUsers.length > 0 ? activeUsers[0].user_id : null;

        // Guardar en caché para admin
        realTimeCache.set(group_id, {
            humidity,
            temperature,
            alert,
            group_id,
            timestamp: new Date().toISOString(),
            expiry: Date.now() + 60000 // Expira en 1 minuto
        });

        // Guardar en DB solo si hay un colaborador activo
        if (user_id) {
            await connection.execute(
                'INSERT INTO sensor_readings (group_id, temperature, humidity, timestamp, user_id) VALUES (?, ?, ?, CONVERT_TZ(NOW(), "UTC", "America/Bogota"), ?)',
                [group_id, temperature, humidity, user_id]
            );

            if (alert && alert.trim() !== '') {
                await connection.execute(
                    'INSERT INTO alerts (group_id, message, timestamp, user_id) VALUES (?, ?, CONVERT_TZ(NOW(), "UTC", "America/Bogota"), ?)',
                    [group_id, alert, user_id]
                );
            }
            connection.release();
            return res.status(200).json({ message: 'Datos recibidos y almacenados exitosamente' });
        } else {
            connection.release();
            return res.status(202).json({ message: 'Datos recibidos pero no almacenados (sin usuario activo)' });
        }
    } catch (error) {
        console.error('Error en datos del sensor:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para obtener el dato más reciente (en tiempo real)
app.get('/iot-data/latest', verifyToken, async (req, res) => {
    const groupId = req.user.group_id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    try {
        const connection = await pool.getConnection();
        let query = 'SELECT id, group_id, temperature, humidity, timestamp, user_id FROM sensor_readings WHERE group_id = ?';
        let params = [groupId];

        // Si no es admin, filtrar por user_id
        if (!isAdmin) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY timestamp DESC LIMIT 1';
        const [rows] = await connection.execute(query, params);
        connection.release();

        // Para admin, devolver datos en caché si no hay datos recientes
        if (isAdmin && rows.length === 0) {
            const cachedData = realTimeCache.get(groupId);
            if (cachedData && cachedData.expiry > Date.now()) {
                console.log(`Dato en caché enviado para group_id ${groupId}:`, cachedData);
                return res.json(cachedData);
            }
        }

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron datos recientes' });
        }

        console.log(`Dato reciente enviado para group_id ${groupId}:`, rows[0]);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener dato reciente:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});


// VERSIÓN ALTERNATIVA - Endpoint sin prepared statements para diagnosticar
app.get('/iot-data/history', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    const group_id = req.user?.group_id;

    // Validar parámetros
    if (!startDate || !endDate) {
      console.error('Faltan parámetros startDate o endDate');
      return res.status(400).json({ error: 'Se requieren startDate y endDate' });
    }

    // Validar formato de fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Fechas inválidas:', { startDate, endDate });
      return res.status(400).json({ error: 'Formato de fechas inválido' });
    }

    if (end < start) {
      console.error('endDate es anterior a startDate:', { startDate, endDate });
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio' });
    }

    // Convertir fechas a strings ISO para MySQL
    const startISO = start.toISOString().slice(0, 19).replace('T', ' ');
    const endISO = end.toISOString().slice(0, 19).replace('T', ' ');

    // Construir consulta como string (sin prepared statements temporalmente)
    let query = `SELECT * FROM sensor_readings WHERE timestamp >= '${startISO}' AND timestamp <= '${endISO}'`;
    
    if (group_id) {
      query += ` AND group_id = ${parseInt(group_id, 10)}`;
    }
    
    query += ` ORDER BY timestamp DESC LIMIT ${parseInt(limit, 10)}`;

    console.log('Ejecutando consulta directa:', {
      query,
      originalDates: { startDate, endDate },
      convertedDates: { startISO, endISO }
    });

    // Usar conexión explícita
    const connection = await pool.getConnection();
    const [rows] = await connection.query(query); // query en lugar de execute
    connection.release();

    console.log(`Datos históricos obtenidos: ${rows.length} registros`);
    
    // Log de algunos datos para verificar
    if (rows.length > 0) {
      console.log('Primeros 2 registros:', rows.slice(0, 2));
    }

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener historial:', error.message, error.stack);
    res.status(500).json({ error: 'Error al obtener historial: ' + error.message });
  }
});

// Endpoint para obtener alertas (protegido por JWT)
app.get('/iot-alerts', verifyToken, async (req, res) => {
    const groupId = req.user.group_id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    try {
        const connection = await pool.getConnection();
        let query = 'SELECT message, timestamp, group_id, user_id FROM alerts WHERE group_id = ?';
        let params = [groupId];

        if (!isAdmin) {
            query += ' AND user_id = ?';
            params.push(userId);
        }

        query += ' ORDER BY timestamp DESC LIMIT 10';
        const [rows] = await connection.execute(query, params);
        connection.release();
        console.log(`Alertas enviadas para group_id ${groupId}: ${rows.length} registros`);
        res.json({ alerts: rows });
    } catch (error) {
        console.error('Error al obtener alertas:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para obtener información del usuario
app.get('/user', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT id, username, role, group_id FROM users WHERE id = ?', [req.user.id]);
        connection.release();
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para crear turnos (mantenido por compatibilidad)
app.post('/shift', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden crear turnos' });
    }
    const { user_id, start_time, end_time, group_id } = req.body;
    if (!user_id || !start_time || !end_time || !group_id) {
        return res.status(400).json({ error: 'user_id, start_time, end_time y group_id son requeridos' });
    }
    try {
        const connection = await pool.getConnection();
        await connection.execute(
            'INSERT INTO shifts (user_id, group_id, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
            [user_id, group_id, start_time, end_time, 'active']
        );
        connection.release();
        res.status(200).json({ message: 'Turno creado exitosamente' });
    } catch (error) {
        console.error('Error al crear turno:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para obtener turnos
app.get('/shifts/:user_id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden ver turnos' });
    }
    const { user_id } = req.params;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT id, user_id, group_id, start_time, end_time, status FROM shifts WHERE user_id = ?',
            [user_id]
        );
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener turnos:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para desempeño
app.get('/user/:user_id/performance', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden ver el desempeño' });
    }
    const { user_id } = req.params;
    try {
        const connection = await pool.getConnection();
        const [shifts] = await connection.execute(
            'SELECT start_time, end_time FROM shifts WHERE user_id = ? AND status = ?',
            [user_id, 'active']
        );

        const alertsPromises = shifts.map(async (shift) => {
            const [rows] = await connection.execute(
                'SELECT message, timestamp FROM alerts WHERE user_id = ? AND timestamp BETWEEN ? AND ?',
                [user_id, shift.start_time, shift.end_time]
            );
            return rows;
        });

        const alertsArrays = await Promise.all(alertsPromises);
        const alerts = alertsArrays.flat();
        connection.release();
        res.json({ alerts });
    } catch (error) {
        console.error('Error al obtener desempeño:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para listar usuarios (solo admin)
app.get('/users', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden ver usuarios' });
    }
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT id, username, role, group_id FROM users');
        connection.release();
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para eliminar usuario (solo admin)
app.delete('/user/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden eliminar usuarios' });
    }
    const { id } = req.params;
    try {
        const connection = await pool.getConnection();
        await connection.execute('DELETE FROM users WHERE id = ?', [id]);
        connection.release();
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

// Endpoint para actualizar usuario (solo admin)
app.put('/user/:id', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden actualizar usuarios' });
    }
    const { id } = req.params;
    const { username, password } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'El nombre de usuario es requerido' });
    }
    try {
        const connection = await pool.getConnection();
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.execute('UPDATE users SET username = ?, password = ? WHERE id = ?', [username, hashedPassword, id]);
        } else {
            await connection.execute('UPDATE users SET username = ? WHERE id = ?', [username, id]);
        }
        connection.release();
        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error.message);
        res.status(500).json({ error: 'Error del servidor', details: error.message });
    }
});

app.listen(5000, () => {
    console.log('Servidor corriendo en http://192.168.0.237:5000');
});