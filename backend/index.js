const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Reemplaza con tu contraseña de MySQL
  database: 'smartriego'
};

const SECRET_KEY = 'your-secret-key'; // Cambia por una clave segura

// Middleware para verificar JWT
const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message, error.stack);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      await connection.end();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await connection.end();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    await connection.end();
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Registro
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    await connection.end();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Obtener datos del usuario
app.get('/user', verifyToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT id, username FROM users WHERE id = ?', [req.user.id]);
    await connection.end();
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('User fetch error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Guardar datos de IoT (sin autenticación)
app.post('/iot-data', async (req, res) => {
  const { humidity, pump_state, mode, coordinates } = req.body;
  console.log('Received IoT data:', req.body);
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO sensor_data (humidity, pump_state, mode, coordinates, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [humidity, pump_state, mode, coordinates ? JSON.stringify(coordinates) : null]
    );
    await connection.end();
    res.status(200).json({ message: 'Data saved' });
  } catch (error) {
    console.error('IoT data save error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Obtener últimos datos de IoT
app.get('/iot-data/latest', verifyToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1');
    await connection.end();
    if (rows.length === 0) return res.status(404).json({ message: 'No data found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('IoT latest data fetch error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Obtener historial de datos de IoT
app.get('/iot-data/history', verifyToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM sensor_data WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
      [startDate, endDate]
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('IoT history fetch error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Guardar imagen
app.post('/capture-image', verifyToken, async (req, res) => {
  const { image } = req.body;
  console.log('Received image data:', { imageLength: image ? image.length : 0 }); // Log para depurar
  try {
    if (!image) {
      console.error('No image provided in request');
      return res.status(400).json({ message: 'No image provided' });
    }
    const connection = await mysql.createConnection(dbConfig);
    const metadata = { capturedBy: 'user', format: 'jpeg' };
    await connection.execute(
      'INSERT INTO camera_data (image, metadata, timestamp) VALUES (?, ?, NOW())',
      [image, JSON.stringify(metadata)]
    );
    await connection.end();
    res.status(200).json({ message: 'Image saved' });
  } catch (error) {
    console.error('Image save error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Obtener imágenes
app.get('/images', verifyToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM camera_data ORDER BY timestamp DESC');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Images fetch error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));