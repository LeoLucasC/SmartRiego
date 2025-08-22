const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db-iot.cx84uymuu7u1.us-east-2.rds.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'lucas2201',
    database: process.env.DB_NAME || 'dbiot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testDatabaseConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión a la base de datos exitosa');
        connection.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error.message);
        process.exit(1);
    }
}

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';

const verifyToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const verifyApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required' });

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT user_id FROM device_keys WHERE api_key = ?', [apiKey]);
        connection.release();
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid API key' });
        req.user = { id: rows[0].user_id };
        next();
    } catch (error) {
        console.error('API key verification error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) {
        return res.status(400).json({ error: 'Username (min 3) and password (min 6) required' });
    }

    try {
        const connection = await pool.getConnection();
        const [existing] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            connection.release();
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await connection.execute(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        const userId = userResult.insertId;

        const apiKey = crypto.randomBytes(32).toString('hex');
        await connection.execute(
            'INSERT INTO device_keys (user_id, api_key) VALUES (?, ?)',
            [userId, apiKey]
        );
        connection.release();

        res.status(201).json({ message: 'User registered successfully', userId, apiKey });
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) {
        return res.status(400).json({ error: 'Username (min 3) and password (min 6) required' });
    }

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) {
            connection.release();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            connection.release();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        connection.release();
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

app.get('/user', verifyToken, async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT id, username FROM users WHERE id = ?', [req.user.id]);
        connection.release();
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('User fetch error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

app.post('/iot-data', verifyApiKey, async (req, res) => {
    const { humidity, temperature, alert } = req.body;
    const userId = req.user.id;

    if (typeof humidity !== 'number' || typeof temperature !== 'number') {
        return res.status(400).json({ error: 'Humidity and temperature must be numbers' });
    }

    try {
        const connection = await pool.getConnection();
        await connection.execute(
            'INSERT INTO sensor_readings (user_id, humidity, temperature, timestamp) VALUES (?, ?, ?, NOW())',
            [userId, humidity, temperature]
        );

        if (alert && alert.trim() !== '') {
            await connection.execute(
                'INSERT INTO alerts (user_id, message, timestamp) VALUES (?, ?, NOW())',
                [userId, alert]
            );
        }

        connection.release();
        res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Sensor data error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

app.get('/iot-data/latest', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM sensor_readings WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1',
            [userId]
        );
        connection.release();
        if (rows.length === 0) return res.status(404).json({ error: 'No data found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Latest data fetch error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

app.get('/iot-data/history', verifyToken, async (req, res) => {
    const userId = req.user.id;
    let { startDate, endDate, limit = 100, offset = 0 } = req.query;

    // Validar formato ISO 8601 o YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z)?$/;
    if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({ error: 'Invalid startDate format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' });
    }
    if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({ error: 'Invalid endDate format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)' });
    }

    // Parsear fechas a formato MySQL (YYYY-MM-DD HH:mm:ss)
    const formatDateForMySQL = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date)) return null;
        return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const start = startDate ? formatDateForMySQL(startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`) : '1970-01-01 00:00:00';
    const end = endDate ? formatDateForMySQL(endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`) : '9999-12-31 23:59:59';

    // Validar y convertir parámetros numéricos
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);
    if (isNaN(parsedLimit) || parsedLimit < 0 || parsedLimit > 1000) {
        return res.status(400).json({ error: 'Invalid limit parameter (0-1000)' });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
        return res.status(400).json({ error: 'Invalid offset parameter' });
    }

    // Log para depuración
    console.log('Parámetros de la consulta:', { userId, start, end, parsedLimit, parsedOffset });

    try {
        const connection = await pool.getConnection();
        
        // SOLUCIÓN: Construir la query dinámicamente para evitar problemas con LIMIT/OFFSET
        const query = `
            SELECT id, user_id, timestamp, humidity, temperature 
            FROM sensor_readings 
            WHERE user_id = ? AND timestamp BETWEEN ? AND ? 
            ORDER BY timestamp DESC 
            LIMIT ${parsedLimit} OFFSET ${parsedOffset}
        `;
        
        const [rows] = await connection.execute(query, [userId, start, end]);
        connection.release();
        
        console.log(`Historial enviado para user_id ${userId}: ${rows.length} registros`);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

app.get('/iot-alerts', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
            'SELECT message, timestamp FROM alerts WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10',
            [userId]
        );
        connection.release();
        console.log(`Alertas enviadas para user_id ${userId}: ${rows.length} registros`);
        res.json({ alerts: rows });
    } catch (error) {
        console.error('Error al obtener alertas:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
testDatabaseConnection().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});