# 🏪 Sistema IoT y Aplicación Móvil para QHATU MARCA S.A.C.

## 📱 Propuesta de Implementación de un Sistema IoT y Móvil para Monitoreo y Traducción

[![Versión](https://img.shields.io/badge/versión-1.0.0-blue.svg)](https://github.com/tu-repo)
[![Estado](https://img.shields.io/badge/estado-En%20Producción-success.svg)](https://github.com/tu-repo)
[![Licencia](https://img.shields.io/badge/licencia-MIT-green.svg)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Endpoints de la API](#-endpoints-de-la-api)
- [Aplicación Móvil](#-aplicación-móvil)
- [Sistema IoT](#-sistema-iot)
- [Detección de Alérgenos](#-detección-de-alérgenos)
- [Despliegue en AWS](#-despliegue-en-aws)
- [Resultados y Beneficios](#-resultados-y-beneficios)
- [Autores](#-autores)
- [Licencia](#-licencia)

---

## 🎯 Descripción General

**QHATU MARCA S.A.C.** es una cadena comercial ubicada en Pillco Marca, Huánuco, Perú, dedicada a la comercialización al detalle y por mayor de provisiones básicas y mercancías diversas, con especial énfasis en productos importados.

Este proyecto de tesis implementa una **solución integrada** que combina:

1. **Sistema IoT** para monitoreo ambiental en tiempo real (temperatura y humedad)
2. **Dashboard Web** para visualización de métricas y alertas automáticas
3. **Aplicación Móvil Android** para traducción de etiquetas de productos importados con detección inteligente de alérgenos

### 🎓 Proyecto de Tesis
- **Institución**: SENATI - Dirección Zonal Ucayali - Huánuco
- **Carrera**: Ingeniería de Software con Inteligencia Artificial
- **Autor**: Leo Rosario Lucas Caqui
- **Asesor**: Mg. Ing. Charlen Máximo Calero Huamán
- **Año**: 2025

---

## ✨ Características Principales

### 🌡️ Sistema IoT de Monitoreo

- ✅ Monitoreo continuo de temperatura y humedad con sensores DHT22
- ✅ Controladores ESP32 con conectividad WiFi
- ✅ Activación automática de ventiladores y humidificadores
- ✅ Alertas en tiempo real cuando se superan umbrales críticos (70°C / 70% humedad)
- ✅ Reducción del 20-30% en pérdidas por deterioro de productos

### 📊 Dashboard Web (React)

- ✅ Visualización de métricas en tiempo real
- ✅ Gráficos históricos de temperatura y humedad
- ✅ Sistema de alertas automáticas
- ✅ Gestión de colaboradores y turnos
- ✅ Búsqueda por rango de fechas
- ✅ Autenticación con JWT

### 📱 Aplicación Móvil Android

- ✅ Escaneo de etiquetas en **Chino** e **Inglés**
- ✅ OCR con **Google Cloud Vision API**
- ✅ Traducción automática al español
- ✅ **Detección inteligente de 19 alérgenos comunes**
- ✅ Alertas visuales con porcentaje de riesgo por alérgeno
- ✅ Información nutricional y de uso
- ✅ Interfaz intuitiva y fácil de usar

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   ESP32 + DHT22 │─────▶│  Backend (API)   │◀────▶│ MongoDB Atlas   │
│   (Sensores IoT)│      │   Node.js/Express│      │   (Base Datos)  │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
              ┌──────▼─────┐           ┌──────▼──────┐
              │ Dashboard  │           │   App Móvil │
              │   React    │           │Android Studio│
              │   (Web)    │           │   (Java)    │
              └────────────┘           └─────────────┘
                                              │
                                       ┌──────▼──────┐
                                       │ Google Cloud│
                                       │  Vision API │
                                       │   (OCR)     │
                                       └─────────────┘
```

---

## 🛠️ Tecnologías Utilizadas

### Hardware IoT
- **Microcontrolador**: ESP32 DevKit V1
- **Sensores**: DHT22 (temperatura y humedad)
- **Actuadores**: Relés, ventiladores, humidificadores
- **Componentes**: LED, buzzer, resistencias

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js
- **Base de Datos**: MongoDB Atlas (Cloud)
- **Autenticación**: JWT (JSON Web Tokens)
- **ORM**: Mongoose

### Frontend Web
- **Framework**: React 18.x
- **Estilos**: Tailwind CSS
- **Gráficos**: Recharts
- **HTTP Client**: Axios

### Aplicación Móvil
- **IDE**: Android Studio
- **Lenguaje**: Java
- **OCR**: Google Cloud Vision API
- **Traducción**: Google Translate API / Custom Service
- **Versión Mínima**: Android 7.0 (API 24)

### Cloud e Infraestructura
- **Hosting Backend**: AWS EC2 / Render
- **Base de Datos**: MongoDB Atlas
- **Storage**: AWS S3 (opcional para imágenes)
- **OCR**: Google Cloud Platform

---

## 📁 Estructura del Proyecto

```
proyecto-qhatu-marca/
│
├── backend/                          # API Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── iotController.js     # Lógica IoT
│   │   │   ├── userController.js    # Gestión usuarios
│   │   │   └── alertController.js   # Sistema alertas
│   │   ├── models/
│   │   │   ├── SensorReading.js     # Modelo lecturas
│   │   │   ├── User.js              # Modelo usuarios
│   │   │   ├── Alert.js             # Modelo alertas
│   │   │   └── Shift.js             # Modelo turnos
│   │   ├── routes/
│   │   │   ├── iotRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── alertRoutes.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js    # JWT validation
│   │   └── config/
│   │       └── database.js          # MongoDB connection
│   ├── index.js                     # Entry point
│   ├── package.json
│   └── .env                         # Variables de entorno
│
├── frontend/                         # Dashboard Web (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx        # Panel principal
│   │   │   ├── RealTimeChart.jsx    # Gráficos tiempo real
│   │   │   ├── HistoryChart.jsx     # Históricos
│   │   │   ├── AlertsList.jsx       # Lista alertas
│   │   │   ├── UserManagement.jsx   # Gestión usuarios
│   │   │   └── Login.jsx            # Autenticación
│   │   ├── services/
│   │   │   └── api.js               # Axios config
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
│
├── mobile/                           # App Android (Java)
│   ├── app/src/main/java/com/example/proyecto_tesis_oe/
│   │   ├── MainActivity.java
│   │   ├── ResultsActivity.java     # Pantalla resultados
│   │   ├── services/
│   │   │   ├── CloudVisionOcrService.java    # OCR Google
│   │   │   └── TranslationService.java       # Traducción
│   │   └── utils/
│   │       └── AllergenDetector.java         # Detector alérgenos
│   ├── app/src/main/res/
│   │   ├── layout/
│   │   │   ├── activity_main.xml
│   │   │   └── activity_results.xml
│   │   └── drawable/
│   │       ├── allergen_alert_background.xml
│   │       └── allergen_item_background.xml
│   ├── build.gradle
│   └── AndroidManifest.xml
│
├── arduino/                          # Código ESP32
│   ├── src/
│   │   └── main.cpp                 # Código Arduino
│   ├── platformio.ini               # Config PlatformIO
│   └── lib/
│
├── database/
│   └── schemas/
│       ├── mongodb_schema.js        # Esquema MongoDB
│       └── seed_data.js             # Datos de prueba
│
├── docs/                            # Documentación
│   ├── TESIS_LEO_LUCAS_CAQUI.pdf
│   ├── diagramas/
│   └── manuales/
│
└── README.md
```

---

## 🗄️ Base de Datos

### MongoDB Atlas - Colecciones

#### 1. **users** - Usuarios del sistema
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: String, // 'admin' | 'colaborador'
  group_id: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **groups** - Grupos de sensores
```javascript
{
  _id: ObjectId,
  name: String, // "Almacén Principal Qhatu Marca"
  location: String,
  description: String,
  createdAt: Date
}
```

#### 3. **sensor_readings** - Lecturas IoT
```javascript
{
  _id: ObjectId,
  group_id: ObjectId,
  temperature: Number,
  humidity: Number,
  timestamp: Date,
  user_id: ObjectId, // Usuario en turno
  device_id: String // ESP32 MAC
}
```

#### 4. **alerts** - Alertas del sistema
```javascript
{
  _id: ObjectId,
  group_id: ObjectId,
  message: String,
  type: String, // 'temperature' | 'humidity'
  value: Number,
  threshold: Number,
  timestamp: Date,
  user_id: ObjectId,
  resolved: Boolean
}
```

#### 5. **shifts** - Turnos de trabajo
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  group_id: ObjectId,
  start_time: Date,
  end_time: Date,
  status: String, // 'active' | 'completed'
  createdAt: Date
}
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18.x o superior
- MongoDB Atlas (cuenta gratuita)
- Android Studio (para la app móvil)
- PlatformIO o Arduino IDE (para ESP32)
- Google Cloud Platform account (para Cloud Vision API)

### 1. Backend

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/qhatu-marca-iot.git
cd qhatu-marca-iot/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/dbiot
# JWT_SECRET=tu_secreto_jwt
# PORT=5000

# Iniciar servidor
npm run dev
```

### 2. Frontend Web

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar API endpoint
# Editar src/services/api.js con la URL de tu backend

# Iniciar en desarrollo
npm start

# Build para producción
npm run build
```

### 3. Aplicación Móvil Android

```bash
# Abrir Android Studio
# File -> Open -> seleccionar carpeta mobile/

# Configurar Google Cloud Vision API
# 1. Crear proyecto en Google Cloud Console
# 2. Habilitar Cloud Vision API
# 3. Crear API Key
# 4. Agregar en app/src/main/res/values/strings.xml:
#    <string name="google_cloud_api_key">TU_API_KEY</string>

# Configurar servicio de traducción
# Editar TranslationService.java con tu endpoint

# Build y ejecutar
# Run -> Run 'app'
```

### 4. Arduino ESP32

```bash
cd arduino

# Abrir en PlatformIO o Arduino IDE

# Configurar WiFi y servidor en main.cpp:
const char* ssid = "TU_RED_WIFI";
const char* password = "TU_PASSWORD";
const char* serverUrl = "http://TU_IP:5000/iot-data";
const int groupId = 1;

# Compilar y subir al ESP32
pio run --target upload

# Monitor serial
pio device monitor
```

---

## 🌐 Endpoints de la API

### Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "admin",
    "role": "admin"
  }
}
```

### IoT Data

```http
# Enviar lectura (desde ESP32)
POST /api/iot-data
Content-Type: application/json

{
  "group_id": 1,
  "temperature": 25.5,
  "humidity": 60.2,
  "device_id": "ESP32_001"
}

# Obtener última lectura
GET /api/iot-data/latest?group_id=1
Authorization: Bearer <token>

# Historial de lecturas
GET /api/iot-data/history?group_id=1&start=2025-01-01&end=2025-01-31
Authorization: Bearer <token>
```

### Alertas

```http
# Listar alertas
GET /api/alerts?group_id=1&limit=10
Authorization: Bearer <token>

# Marcar alerta como resuelta
PUT /api/alerts/:id/resolve
Authorization: Bearer <token>
```

### Usuarios y Turnos

```http
# Listar usuarios (solo admin)
GET /api/users
Authorization: Bearer <token>

# Crear usuario (solo admin)
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "colaborador1",
  "email": "colaborador1@qhatu.com",
  "password": "pass123",
  "role": "colaborador",
  "group_id": 1
}

# Gestión de turnos
POST /api/shifts
GET /api/shifts/:user_id
PUT /api/shifts/:id/end
```

---

## 📱 Aplicación Móvil

### Funcionalidades

1. **Escaneo de Productos**
   - Captura de imagen con la cámara
   - Procesamiento OCR con Google Cloud Vision
   - Extracción de texto en chino/inglés

2. **Traducción Automática**
   - Conversión al español
   - Detección de ingredientes
   - Información nutricional

3. **Detección de Alérgenos** (NUEVA FUNCIONALIDAD)
   - **19 alérgenos detectados**:
     - Maní/Cacahuate (95% riesgo)
     - Leche/Lácteos (85% riesgo)
     - Huevo (80% riesgo)
     - Gluten/Trigo (75% riesgo)
     - Soya/Soja (70% riesgo)
     - Almendras, Nueces, Avellanas (80-85% riesgo)
     - Pescado (75% riesgo)
     - Mariscos/Camarón/Langostino/Crustáceos (90% riesgo)
     - Sésamo/Ajonjolí (85% riesgo)

4. **Alertas Visuales**
   - Tarjeta roja destacada con lista de alérgenos
   - Porcentaje de riesgo por cada alérgeno
   - Código de colores (rojo: >90%, naranja: 80-89%, amarillo: <80%)
   - Recomendación: "Consulte con su médico"

### Pantallas Principales

- **MainActivity**: Captura de imagen
- **ResultsActivity**: 
  - Texto reconocido (OCR)
  - **Alerta de alérgenos (centro de pantalla)**
  - Traducción al español
  - Botones para copiar texto

### Ejemplo de Uso

```
1. Usuario escanea producto importado chino
2. OCR detecta: "Contains: 花生, 大豆, 芝麻"
3. Sistema traduce: "Contiene: maní, soya, sésamo"
4. ⚠️ ALERTA VISUAL APARECE:
   
   "Este producto contiene alérgenos comunes:
    Maní, Soya, Sésamo
    
    Consulte con su médico si es alérgico."
    
    Alérgenos detectados:
    🔴 Maní          95% riesgo
    🟠 Soya          70% riesgo
    🟠 Sésamo        85% riesgo
```

---

## 🌡️ Sistema IoT

### Configuración de Hardware

```
ESP32 DevKit V1
├── DHT22 Sensor
│   ├── VCC → 3.3V
│   ├── GND → GND
│   └── DATA → GPIO 4
├── LED (Alerta)
│   ├── Ánodo → GPIO 2 (+ Resistencia 220Ω)
│   └── Cátodo → GND
└── Buzzer
    ├── + → GPIO 5
    └── - → GND
```

### Umbrales de Alerta

| Variable    | Umbral Crítico | Acción                          |
|-------------|----------------|---------------------------------|
| Temperatura | > 70°C         | Activar ventilador + Alerta     |
| Humedad     | > 70%          | Activar deshumidificador + Alerta |

### Flujo de Datos

```
1. DHT22 lee temp/humedad cada 5 segundos
2. ESP32 evalúa umbrales
3. Si excede → Activa actuadores + LED + Buzzer
4. Envía datos a backend vía HTTP POST
5. Backend guarda en MongoDB + Genera alerta
6. Dashboard/App muestran notificación en tiempo real
```

---

## 🚨 Detección de Alérgenos

### Algoritmo de Detección

```java
// ResultsActivity.java - Método detectAllergens()

1. Texto reconocido se convierte a minúsculas
2. Se busca cada uno de los 19 alérgenos
3. Si se encuentra coincidencia:
   - Se agrega a lista con porcentaje de riesgo
   - Se genera AllergenInfo(nombre, riesgo)
4. Si lista no está vacía:
   - Se muestra tarjeta de alerta
   - Se listan alérgenos con colores por riesgo
5. Colores según nivel:
   - Rojo oscuro: ≥90% (mariscos, maní)
   - Naranja oscuro: 80-89% (nueces, lácteos)
   - Naranja claro: <80% (soya, trigo)
```

### Mapa de Riesgo de Alérgenos

```java
ALERGENOS_RIESGO = {
  "maní": 95%,
  "cacahuate": 95%,
  "mariscos": 90%,
  "camarón": 90%,
  "langostino": 90%,
  "crustáceos": 90%,
  "leche": 85%,
  "lácteos": 85%,
  "nueces": 85%,
  "sésamo": 85%,
  "ajonjolí": 85%,
  "huevo": 80%,
  "almendras": 80%,
  "avellanas": 80%,
  "gluten": 75%,
  "trigo": 75%,
  "pescado": 75%,
  "soya": 70%,
  "soja": 70%
}
```

---

### Pasos de Despliegue

1. **Backend en EC2**
```bash
# Conectar a EC2
ssh -i tu-llave.pem ubuntu@tu-ip-ec2

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar repo y configurar
git clone https://github.com/tu-repo.git
cd backend
npm install
npm install -g pm2

# Variables de entorno
nano .env
# (agregar MONGODB_URI, JWT_SECRET, etc.)

# Iniciar con PM2
pm2 start index.js --name qhatu-backend
pm2 save
pm2 startup
```

2. **Configurar Security Group**
   - Abrir puerto 5000 (HTTP Backend)
   - Abrir puerto 22 (SSH)
   - Configurar HTTPS (443) con certificado SSL (opcional)

3. **MongoDB Atlas**
   - Whitelist IP de EC2
   - Configurar usuario y password
   - Copiar connection string

4. **Frontend en Netlify/Vercel**
```bash
# Build
cd frontend
npm run build

# Deploy (ejemplo Netlify)
netlify deploy --prod --dir=build
```

---

## 📈 Resultados y Beneficios

### Impacto Operativo

| Métrica                          | Antes      | Después   | Mejora    |
|----------------------------------|------------|-----------|-----------|
| Pérdidas por deterioro           | 30%        | 10%       | -20%      |
| Tiempo de monitoreo manual       | 15 hrs/sem | 6 hrs/sem | -60%      |
| Tiempo de traducción manual      | 5 min/prod | 30 seg    | -90%      |
| Satisfacción del cliente         | 70%        | 87.5%     | +25%      |
| Incidentes por productos mal conservados | 12/mes | 3/mes | -75%      |

### Beneficios Económicos

```
Inversión Total: S/ 6,778.60
├── Materiales IoT: S/ 68.80
├── Mano de obra: S/ 3,116.80
├── Equipos: S/ 2,450.00
└── Otros costos: S/ 1,143.00

Beneficios Anuales: S/ 14,400.00
├── Reducción pérdidas: S/ 3,600
├── Optimización inventario: S/ 3,000
├── Eficiencia operativa: S/ 2,400
├── Satisfacción cliente: S/ 2,400
├── Ahorro energético: S/ 1,800
└── Otros beneficios: S/ 1,200

ROI: 112% anual
Tiempo de recuperación: 6.7 meses
```

### Indicadores Técnicos

- ✅ Disponibilidad del sistema: 99.5%
- ✅ Tiempo de respuesta API: < 200ms
- ✅ Precisión OCR: 92%
- ✅ Tasa de detección de alérgenos: 95%
- ✅ Alertas en tiempo real: < 5 segundos

---

## 👥 Autores

**Leo Rosario Lucas Caqui**
- 🎓 Estudiante de Ingeniería de Software con IA - SENATI
- 📧 Email: [leo.lucas@senati.pe](mailto:leo.lucas@senati.pe)
- 💼 LinkedIn: [linkedin.com/in/leolucas](https://linkedin.com/in/leolucas)
- 🐙 GitHub: [@leolucascaqui](https://github.com/leolucascaqui)

**Asesor Académico**
- Mg. Ing. Charlen Máximo Calero Huamán
- SENATI - Dirección Zonal Ucayali - Huánuco

---

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **QHATU MARCA S.A.C.** por facilitar el espacio y recursos para implementación
- **SENATI** por el apoyo académico e infraestructura
- **Google Cloud Platform** por las APIs de Cloud Vision
- **MongoDB** por MongoDB Atlas
- **AWS** por los servicios en la nube

---

## 📞 Contacto y Soporte

Para consultas sobre el proyecto:

- 📧 Email: softlyer@gmail.com
- 🏢 Empresa: QHATU MARCA S.A.C.
- 📍 Ubicación: Av. Juan Velasco Alvarado Nro. 729, Pillco Marca, Huánuco

---

## 🔄 Roadmap Futuro

- [ ] Integración con sistema de punto de venta (POS)
- [ ] App móvil para iOS
- [ ] Predicción de demanda con Machine Learning
- [ ] Expansión a múltiples tiendas
- [ ] Dashboard analítico avanzado con BI
- [ ] Notificaciones push para alertas críticas
- [ ] Integración con proveedores para reabastecimiento automático

---

<div align="center">

**Hecho con ❤️ para QHATU MARCA S.A.C.**

*Innovando el retail local con IoT e Inteligencia Artificial*

[⬆ Volver arriba](#-sistema-iot-y-aplicación-móvil-para-qhatu-marca-sac)

</div>
