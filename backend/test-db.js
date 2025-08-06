const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'riego_iot',
    });

    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    console.log('Conexión exitosa a MySQL. Resultado de prueba:', rows[0].result);
    await pool.end();
  } catch (error) {
    console.error('Error al conectar a MySQL:', error.message);
  }
}

testConnection();