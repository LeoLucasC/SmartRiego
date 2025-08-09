const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smartriego',
});

// Middleware para verificar token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido' });
  }
};

// Ruta de prueba para verificar conexión a MySQL
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ message: 'Conexión a MySQL exitosa', result: rows[0].result });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar a MySQL', details: error.message });
  }
});

// Ruta de registro
app.post('/register', async (req, res) => {
  const { username, password, email, fullName } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, fullName) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email || null, fullName || null]
    );
    const token = jwt.sign({ id: result.insertId, username }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' });
    res.status(201).json({ message: 'Usuario registrado', token });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El usuario o correo ya existe' });
    } else {
      res.status(500).json({ error: 'Error en el servidor', details: error.message });
    }
  }
});

// Ruta de login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secreto', {
      expiresIn: '1h',
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
});

// Ruta para obtener datos del usuario
app.get('/user', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT username, fullName FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
});

// Ruta para recibir datos del NodeMCU
app.post('/iot-data', authenticateToken, async (req, res) => {
  const { humidity, pump_state, mode, coordinates } = req.body;
  try {
    await pool.query(
      'INSERT INTO sensor_data (user_id, humidity, pump_state, mode, coordinates) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, humidity, pump_state, mode, coordinates ? JSON.stringify(coordinates) : null]
    );
    res.status(201).json({ message: 'Datos IoT recibidos' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar datos', details: error.message });
  }
});

// Ruta para obtener datos en tiempo real (último dato)
app.get('/iot-data/latest', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT humidity, pump_state, mode, timestamp, coordinates FROM sensor_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No hay datos disponibles' });
    const data = rows[0];
    data.coordinates = data.coordinates ? JSON.parse(data.coordinates) : null;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos', details: error.message });
  }
});

// Ruta para obtener datos históricos (con filtro por fechas)
app.get('/iot-data/history', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = 'SELECT humidity, pump_state, mode, timestamp, coordinates FROM sensor_data WHERE user_id = ?';
    const params = [req.user.id];

    if (startDate && endDate) {
      query += ' AND timestamp BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY timestamp ASC LIMIT 1000';
    const [rows] = await pool.query(query, params);
    const data = rows.map(row => ({
      ...row,
      coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
    }));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos históricos', details: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1');
    console.log(`Servidor corriendo en puerto ${PORT}`);
  } catch (error) {
    console.error('Error al conectar a MySQL al iniciar el servidor:', error.message);
  }
});