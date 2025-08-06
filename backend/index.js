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

// Ruta de registro
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'El usuario ya existe' });
    } else {
      res.status(500).json({ error: 'Error en el servidor' });
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
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1'); // Prueba de conexión al iniciar
    console.log(`Servidor corriendo en puerto ${PORT}`);
  } catch (error) {
    console.error('Error al conectar a MySQL al iniciar el servidor:', error.message);
  }
});