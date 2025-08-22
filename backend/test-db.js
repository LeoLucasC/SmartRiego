const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
  // Configuración CORRECTA
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db-iot.cx84uymuu7u1.us-east-2.rds.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'lucas2201',
    database: process.env.DB_NAME || 'dbiot', // ← NOMBRE DE LA BD QUE CREASTE
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // You can add a test query here if needed
  const [rows] = await pool.query('SELECT 1');
  console.log('Connection successful:', rows);
  await pool.end();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();