🌡️ Sistema IoT de Monitoreo de Temperatura y Humedad para Qhatu Marca SAC

Bienvenido al Sistema IoT de Monitoreo de Temperatura y Humedad desarrollado para Qhatu Marca SAC, una minimarket que ofrece productos importados, abarrotes y otros bienes esenciales. Este sistema monitorea en tiempo real las condiciones de temperatura y humedad en el área de almacenamiento para garantizar la calidad y conservación de los productos, especialmente alimentos perecederos e importados sensibles al ambiente. Utiliza un Arduino ESP32 (simulado en Wokwi y PlatformIO) para recolectar datos, un backend en Node.js para procesarlos, AWS Aurora MySQL para almacenamiento escalable en la nube, y un frontend en React para visualización intuitiva.
📜 Descripción
Qhatu Marca SAC es una minimarket dedicada a la venta de productos importados y abarrotes. Este proyecto implementa un sistema IoT para monitorear las condiciones ambientales en el almacén, asegurando que los productos se mantengan en condiciones óptimas. Las características principales son:

Monitoreo en tiempo real: Un Arduino ESP32 con sensor DHT22 (simulado en Wokwi y compilado con PlatformIO) mide temperatura y humedad, enviando datos al backend cada 5 segundos.
Alertas automáticas: Notifica al personal si la temperatura supera los 70°C o la humedad los 70%, protegiendo productos perecederos.
Gestión de turnos: Asocia las lecturas a empleados según turnos activos, facilitando el seguimiento de responsabilidades.
Dashboard web: Un frontend en React muestra datos en tiempo real, historial de lecturas y alertas, accesible para administradores y colaboradores.
Almacenamiento en la nube: Usa AWS Aurora MySQL para una base de datos relacional escalable, confiable y optimizada para entornos en la nube.

Finalidad: Mantener la calidad de los productos en Qhatu Marca SAC mediante el monitoreo continuo de temperatura y humedad, con alertas inmediatas y un sistema de gestión eficiente para el personal.
🛠️ Tecnologías

Hardware:
Arduino ESP32 (simulado en Wokwi y PlatformIO)
Sensor DHT22 (temperatura y humedad)
Pantalla LCD I2C (16x2) para visualización local


Simuladores:
Wokwi: Entorno de simulación para probar el comportamiento del Arduino ESP32.
PlatformIO: IDE para compilar y gestionar el código del Arduino.


Backend:
Node.js con Express
JWT para autenticación de usuarios
MySQL2 para conexión a AWS Aurora MySQL


Base de datos:
AWS Aurora MySQL: Base de datos relacional en la nube, compatible con MySQL, con alta disponibilidad y escalabilidad


Frontend:
React con Axios para solicitudes HTTP
Tailwind CSS (opcional, según tu implementación)


Infraestructura:
AWS EC2 (para el backend, IP: 192.168.0.237 en simulación o producción)
AWS Aurora MySQL (para almacenamiento de datos)


Protocolo:
HTTP para comunicación Arduino-backend



📋 Estructura del proyecto
qhatu-marca-iot/
├── backend/
│   ├── index.js              # Servidor Node.js con Express
│   ├── package.json          # Dependencias del backend
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx # Dashboard para datos en tiempo real e historial
│   │   │   └── ...
│   │   ├── App.jsx
│   │   └── ...
│   ├── package.json          # Dependencias del frontend
│   └── ...
├── arduino/
│   ├── main.cpp              # Código para Arduino ESP32
│   └── ...
├── database/
│   ├── dbiot_schema.sql      # Script SQL para la base de datos
│   └── ...
└── README.md

🗄️ Estructura de la base de datos (AWS Aurora MySQL)
La base de datos dbiot, alojada en AWS Aurora MySQL, está diseñada para soportar el monitoreo de temperatura y humedad en Qhatu Marca SAC. Las tablas son:

users: Almacena empleados y administradores (username, password hasheada, role, group_id).
groups: Define grupos de sensores (group_id, name, por ejemplo, "Almacén Qhatu Marca").
shifts: Gestiona turnos del personal (user_id, group_id, start_time, end_time, status).
sensor_readings: Guarda lecturas de temperatura y humedad (group_id, temperature, humidity, timestamp, user_id).
alerts: Registra alertas generadas (group_id, message, timestamp, user_id).

Script SQL:El script para crear la base de datos está en database/dbiot_schema.sql. Para aplicarlo en AWS Aurora MySQL:

Conéctate al clúster Aurora:mysql -h <tu_endpoint_aurora_mysql> -u root -p


Ejecuta:SOURCE database/dbiot_schema.sql;


Verifica las tablas:SHOW TABLES;
DESCRIBE users;
DESCRIBE groups;
DESCRIBE shifts;
DESCRIBE sensor_readings;
DESCRIBE alerts;



Configuración de zona horaria:
SET GLOBAL time_zone = '-05:00';
SELECT NOW();

🚀 Instalación y configuración
Requisitos previos

Hardware: Arduino ESP32, sensor DHT22, pantalla LCD I2C (simulados en Wokwi/PlatformIO durante desarrollo).
Software:
Node.js 18.x
npm para backend y frontend
Wokwi (simulador online para Arduino)
PlatformIO (IDE para compilar código Arduino)
AWS CLI o MySQL Workbench para Aurora MySQL


AWS:
Clúster Aurora MySQL configurado (endpoint, usuario, contraseña).
Instancia EC2 para el backend (IP: 192.168.0.237 o similar).
Grupos de seguridad para permitir conexiones (puerto 3306 para Aurora, 5000 para el backend).



Backend

Navega al directorio backend:cd backend


Instala dependencias:npm install


Configura las variables de entorno en .env:DB_HOST=<tu_endpoint_aurora_mysql>
DB_USER=root
DB_PASSWORD=<tu_contraseña>
DB_DATABASE=dbiot
JWT_SECRET=your_jwt_secret_key


Inicia el servidor:node index.js

El servidor correrá en http://192.168.0.237:5000.

Base de datos (AWS Aurora MySQL)

Conéctate al clúster Aurora:mysql -h <tu_endpoint_aurora_mysql> -u root -p


Aplica el script:SOURCE database/dbiot_schema.sql;


Verifica los datos de prueba:SELECT * FROM users;
SELECT * FROM sensor_readings;
SELECT * FROM alerts;



Arduino

Abre arduino/main.cpp en PlatformIO o importa el proyecto desde Wokwi.
Configura la red WiFi y la URL del servidor:const char* ssid = "tu_red_wifi";
const char* password = "tu_contraseña_wifi";
const char* serverName = "http://192.168.0.237:5000/iot-data";
const int groupId = 1;


Compila y carga el código al Arduino ESP32 (o simula en Wokwi).
Abre el Monitor Serial (115200 baudios) para verificar:
Deberías ver: Respuesta del servidor (Código 200): {"message":"Datos guardados exitosamente"}.



Frontend

Navega al directorio frontend:cd frontend


Instala dependencias:npm install


Configura la URL del backend (por ejemplo, en Dashboard.jsx):const apiUrl = 'http://192.168.0.237:5000';


Inicia el frontend:npm start

Accede en http://localhost:3000.

📡 Endpoints principales

POST /iot-data: Recibe datos del Arduino (group_id, temperature, humidity, alert).
GET /iot-data/latest: Muestra la lectura más reciente para el group_id del usuario.
GET /iot-data/history: Devuelve el historial de lecturas en un rango de fechas.
GET /iot-alerts: Lista las últimas 10 alertas.
POST /login: Autentica empleados y genera un token JWT.
GET /user: Obtiene información del usuario logueado.
POST /shift, GET /shifts/:user_id, GET /user/:user_id/performance: Gestión de turnos y desempeño (solo admin).
GET /users, PUT /user/:id, DELETE /user/:id: Gestión de empleados (solo admin).

🌐 Despliegue en AWS
El sistema está optimizado para Qhatu Marca SAC usando AWS:

AWS Aurora MySQL:
Clúster Aurora con compatibilidad MySQL 8.x, alojado en una VPC.
Configura grupos de seguridad para permitir conexiones desde la instancia EC2.
Soporta escalado automático para futuras expansiones de la minimarket.


AWS EC2:
Instancia para el backend Node.js (IP: 192.168.0.237).
Abre el puerto 5000 en el grupo de seguridad.
Opcional: Usa un balanceador de carga para alta disponibilidad.


Simulación:
Durante el desarrollo, el Arduino se simula en Wokwi y se compila con PlatformIO, permitiendo pruebas sin hardware físico.



🔧 Depuración
Si encuentras problemas:

Arduino (Wokwi/PlatformIO):
Revisa el Monitor Serial para errores (por ejemplo, código HTTP -1 o 400).
En Wokwi, verifica la configuración de red simulada: ping 192.168.0.237.


Backend:
Consulta los logs en index.js para parámetros y errores.
Verifica la conexión a Aurora: mysql -h <endpoint> -u root -p.


Frontend:
Abre la consola del navegador para errores en /iot-data/latest o /iot-data/history.


Base de datos:
Verifica datos:SELECT * FROM sensor_readings WHERE group_id = 1 ORDER BY timestamp DESC LIMIT 10;
SELECT * FROM alerts WHERE group_id = 1 ORDER BY timestamp DESC LIMIT 10;





🤝 Contribuciones
¡Ayúdanos a mejorar el sistema para Qhatu Marca SAC!:

Haz un fork del repositorio.
Crea una rama: git checkout -b mi-funcionalidad.
Commitea tus cambios: git commit -m "Añadir funcionalidad X".
Haz push: git push origin mi-funcionalidad.
Abre un Pull Request.

📧 Contacto
Para dudas o sugerencias, contacta al equipo en [Softlyer@gmail.com].

Hecho con 💪 para Qhatu Marca SAC por [Leo Rosario Lucas CAqui]
