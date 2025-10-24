const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 
  'mongodb+srv://admin:Lucas2201@db-iot.zeh1ca3.mongodb.net/iot-db?retryWrites=true&w=majority';

async function connectDB() {
  try {
    await mongoose.connect(mongoURI);  // Sin las opciones obsoletas
    console.log('✅ Conexión a MongoDB Atlas exitosa');
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    process.exit(1);
  }
}

connectDB();