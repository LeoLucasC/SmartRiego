#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN 15
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

const char* ssid = "Wokwi-GUEST";
const char* password = "";
// IMPORTANTE: Cambiar esta IP por la IP real de tu servidor
const char* serverName = "http://192.168.0.237:5000/iot-data"; 
const int groupId = 1; // Debe coincidir con un group_id existente en la BD

float simulatedTemperature = 25.0;
float simulatedHumidity = 50.0;
unsigned long lastPeakTime = 0;
const unsigned long peakInterval = 120000; // 2 minutos
bool isRising = true;

// Variables para debugging
unsigned long lastSendTime = 0;
int sendCount = 0;
int successCount = 0;
int errorCount = 0;

void setup() {
    Serial.begin(115200);
    delay(2000); // Dar tiempo para que se inicialice el Serial
    
    Serial.println("=====================================");
    Serial.println("    INICIANDO SENSOR ESP32");
    Serial.println("=====================================");
    Serial.println("Configuración:");
    Serial.println("- SSID: " + String(ssid));
    Serial.println("- Servidor: " + String(serverName));
    Serial.println("- Group ID: " + String(groupId));
    Serial.println("=====================================");

    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Iniciando...");
    lcd.setCursor(0, 1);
    lcd.print("ESP32 IoT Sensor");
    delay(2000);

    dht.begin();

    // Conexión WiFi con más detalles
    Serial.println("Conectando a WiFi...");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Conectando WiFi");
    
    WiFi.begin(ssid, password);
    int wifiAttempts = 0;
    const int maxWifiAttempts = 15; // Más intentos
    
    while (WiFi.status() != WL_CONNECTED && wifiAttempts < maxWifiAttempts) {
        delay(1000);
        Serial.print(".");
        lcd.setCursor(0, 1);
        lcd.print("Intento " + String(wifiAttempts + 1) + "/" + String(maxWifiAttempts));
        wifiAttempts++;
    }
    
    Serial.println();
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("✓ CONECTADO A WIFI EXITOSAMENTE");
        Serial.println("- IP local: " + WiFi.localIP().toString());
        Serial.println("- RSSI: " + String(WiFi.RSSI()) + " dBm");
        Serial.println("- Gateway: " + WiFi.gatewayIP().toString());
        
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("WiFi Conectado");
        lcd.setCursor(0, 1);
        lcd.print(WiFi.localIP().toString());
        delay(3000);
    } else {
        Serial.println("✗ ERROR: No se pudo conectar a WiFi");
        Serial.println("- Estado WiFi: " + String(WiFi.status()));
        
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Error WiFi");
        lcd.setCursor(0, 1);
        lcd.print("Status:" + String(WiFi.status()));
        
        while (true) {
            delay(5000);
            Serial.println("Reintentando conexión WiFi...");
            WiFi.begin(ssid, password);
            delay(10000);
            if (WiFi.status() == WL_CONNECTED) {
                Serial.println("✓ Conectado después de reintentar");
                break;
            }
        }
    }
    
    lastPeakTime = millis();
    Serial.println("=====================================");
    Serial.println("    SETUP COMPLETADO - INICIANDO LOOP");
    Serial.println("=====================================");
}

void loop() {
    unsigned long currentTime = millis();
    
    // Simulación de datos (tu lógica actual)
    if (currentTime - lastPeakTime >= peakInterval) {
        lastPeakTime = currentTime;
        isRising = true;
        simulatedTemperature = 25.0;
        simulatedHumidity = 50.0;
        Serial.println("--- NUEVO CICLO DE TEMPERATURA ---");
    }
    
    float progress = (float)(currentTime - lastPeakTime) / peakInterval;
    
    if (isRising) {
        if (progress < 0.5) {
            simulatedTemperature = 25.0 + (70.0 - 25.0) * (progress * 2);
            simulatedHumidity = 50.0 + (75.0 - 50.0) * (progress * 2);
        } else {
            isRising = false;
        }
    } else {
        float fallProgress = (progress - 0.5) * 2;
        simulatedTemperature = 70.0 - (70.0 - 25.0) * fallProgress;
        simulatedHumidity = 75.0 - (75.0 - 50.0) * fallProgress;
    }

    // Mostrar en LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print(simulatedTemperature, 1);
    lcd.print("C H:");
    lcd.print(simulatedHumidity, 0);
    lcd.print("%");
    
    // Segunda línea con estado
    lcd.setCursor(0, 1);
    if (WiFi.status() == WL_CONNECTED) {
        lcd.print("WiFi OK Send:");
        lcd.print(successCount);
    } else {
        lcd.print("WiFi ERROR");
    }

    // Detectar alertas
    bool highTemperature = simulatedTemperature > 70.0;
    bool highHumidity = simulatedHumidity > 70.0;
    String alertMessage = "";
    if (highTemperature) alertMessage += "Alta Temp ";
    if (highHumidity) alertMessage += "Alta Humedad";
    
    // ENVÍO DE DATOS - Con debugging detallado
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("--- ENVIANDO DATOS ---");
        Serial.println("Tiempo transcurrido desde último envío: " + String(currentTime - lastSendTime) + " ms");
        
        HTTPClient http;
        http.begin(serverName);
        http.addHeader("Content-Type", "application/json");
        http.setTimeout(10000); // Timeout de 10 segundos

        String jsonData = "{\"humidity\": " + String(simulatedHumidity, 1) + 
                         ",\"temperature\": " + String(simulatedTemperature, 1) + 
                         ",\"alert\": \"" + alertMessage + "\"" +
                         ",\"group_id\": " + String(groupId) + "}";

        Serial.println("JSON enviado: " + jsonData);
        Serial.println("URL destino: " + String(serverName));
        Serial.println("Enviando solicitud HTTP POST...");
        
        sendCount++;
        lastSendTime = currentTime;
        
        int httpResponseCode = http.POST(jsonData);

        Serial.println("Código de respuesta HTTP: " + String(httpResponseCode));
        
        if (httpResponseCode > 0) {
            String response = http.getString();
            Serial.println("✓ RESPUESTA EXITOSA:");
            Serial.println("Código: " + String(httpResponseCode));
            Serial.println("Respuesta del servidor: " + response);
            
            successCount++;
            
            // Mostrar éxito en LCD
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Enviado OK!");
            lcd.setCursor(0, 1);
            lcd.print("Code: " + String(httpResponseCode));
            delay(1500);
            
        } else {
            Serial.println("✗ ERROR EN SOLICITUD HTTP:");
            Serial.println("Código de error: " + String(httpResponseCode));
            
            String errorMsg = "";
            switch(httpResponseCode) {
                case -1: errorMsg = "Conexión fallida"; break;
                case -2: errorMsg = "Envío fallido"; break;
                case -3: errorMsg = "Conexión perdida"; break;
                case -4: errorMsg = "Sin respuesta"; break;
                case -11: errorMsg = "Timeout"; break;
                default: errorMsg = "Error " + String(httpResponseCode);
            }
            
            Serial.println("Descripción del error: " + errorMsg);
            Serial.println("URL intentada: " + String(serverName));
            Serial.println("JSON que se intentó enviar: " + jsonData);
            
            errorCount++;
            
            // Mostrar error en LCD
            lcd.clear();
            lcd.setCursor(0, 0);
            lcd.print("Error HTTP");
            lcd.setCursor(0, 1);
            lcd.print(errorMsg);
            delay(2000);
        }

        // Estadísticas
        Serial.println("--- ESTADÍSTICAS ---");
        Serial.println("Total envíos: " + String(sendCount));
        Serial.println("Exitosos: " + String(successCount));
        Serial.println("Errores: " + String(errorCount));
        Serial.println("Tasa de éxito: " + String((float)successCount/sendCount*100, 1) + "%");

        http.end();
    } else {
        Serial.println("✗ ERROR: WiFi desconectado - Estado: " + String(WiFi.status()));
        Serial.println("Intentando reconectar...");
        
        WiFi.begin(ssid, password);
        delay(2000);
        
        if (WiFi.status() == WL_CONNECTED) {
            Serial.println("✓ WiFi reconectado exitosamente");
        } else {
            Serial.println("✗ Fallo la reconexión WiFi");
        }
        
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("WiFi Error");
        lcd.setCursor(0, 1);
        lcd.print("Reconectando...");
        delay(1000);
    }

    // Mostrar tiempo hasta próximo pico
    unsigned long timeToNextPeak = peakInterval - (currentTime - lastPeakTime);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Prox:");
    lcd.print(timeToNextPeak / 1000);
    lcd.print("s T:");
    lcd.print(simulatedTemperature, 0);
    lcd.setCursor(0, 1);
    lcd.print("OK:");
    lcd.print(successCount);
    lcd.print(" Err:");
    lcd.print(errorCount);
    
    Serial.println("=====================================");
    delay(5000); // Enviar cada 5 segundos
}