#define BLYNK_TEMPLATE_ID "TMPL2bofkLJPE"
#define BLYNK_TEMPLATE_NAME "sensor de ambiente"
#define BLYNK_AUTH_TOKEN "_QaziEUt72NEZrRwPkKUJqRcUoeHQ8__"

#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

char auth[] = "_QaziEUt72NEZrRwPkKUJqRcUoeHQ8__";
char ssid[] = "Lucas"; // Ajusta a tu SSID de WiFi
char pass[] = "123456789"; // Ajusta a tu contraseña de WiFi
const char* serverUrl = "http://192.168.43.231:5000/iot-data"; // IP de tu computadora

int sensorPin = A0;
int relayPin = 5; // D1 = GPIO5
int threshold = 40; // Umbral de humedad (%)
bool modoAutomatico = true;
bool bombaEncendida = false;
bool enEspera = false;

BlynkTimer timer;

unsigned long tiempoRiego = 10000; // 10 segundos
unsigned long tiempoEspera = 120000; // 5 minutos
unsigned long ultimaActivacionBomba = 0;

void debugPrint(String message) {
  Serial.print("[DEBUG] ");
  Serial.println(message);
}

BLYNK_WRITE(V4) {
  modoAutomatico = param.asInt();
  debugPrint("Modo cambiado a: " + String(modoAutomatico ? "Automático" : "Manual"));
  if (modoAutomatico) {
    digitalWrite(relayPin, HIGH);
    Blynk.virtualWrite(V3, 0);
    debugPrint("Bomba apagada al cambiar a modo automático");
    enEspera = false;
  }
}

BLYNK_WRITE(V3) {
  if (!modoAutomatico) {
    int estado = param.asInt();
    digitalWrite(relayPin, estado == 1 ? LOW : HIGH);
    debugPrint("Manual: Bomba " + String(estado == 1 ? "encendida" : "apagada"));
  } else {
    debugPrint("Ignorando cambio en V3 porque está en modo automático");
  }
}

void enviarDatosIoT(int humidity, bool pump_state, bool mode) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");

    DynamicJsonDocument doc(200);
    doc["humidity"] = humidity;
    doc["pump_state"] = pump_state;
    doc["mode"] = mode;
    
    if (pump_state) {
      JsonArray coordinates = doc.createNestedArray("coordinates");
      coordinates.add(-34.6037); // lat1
      coordinates.add(-58.3816); // lng1
      coordinates.add(-34.5937); // lat2
      coordinates.add(-58.3716); // lng2
    }

    String payload;
    serializeJson(doc, payload);
    debugPrint("Enviando datos: " + payload);

    int httpCode = http.POST(payload);

    if (httpCode == 200) {
      debugPrint("Datos enviados correctamente. Respuesta: " + http.getString());
    } else {
      debugPrint("Error al enviar datos: HTTP " + String(httpCode) + " - " + http.errorToString(httpCode));
    }
    http.end();
  } else {
    debugPrint("WiFi no conectado. No se enviaron datos.");
  }
}

void controlarBomba(int humedad) {
  unsigned long tiempoActual = millis();

  if (enEspera) {
    if (tiempoActual - ultimaActivacionBomba >= tiempoEspera) {
      enEspera = false;
      debugPrint("Período de espera finalizado.");
    } else {
      debugPrint("En período de espera. Tiempo restante: " + String((tiempoEspera - (tiempoActual - ultimaActivacionBomba)) / 1000) + " s");
      return;
    }
  }

  if (humedad < threshold && !bombaEncendida && !enEspera) {
    digitalWrite(relayPin, LOW);
    bombaEncendida = true;
    ultimaActivacionBomba = tiempoActual;
    debugPrint("Automático: BOMBA ENCENDIDA por " + String(tiempoRiego / 1000) + " s (Humedad: " + String(humedad) + "%)");
    Blynk.logEvent("lowmoisture", "Humedad baja detectada: " + String(humedad) + "%");
    timer.setTimeout(tiempoRiego, []() {
      digitalWrite(relayPin, HIGH);
      bombaEncendida = false;
      enEspera = true;
      debugPrint("Automático: BOMBA APAGADA. Iniciando espera de " + String(tiempoEspera / 1000) + " s");
    });
  }
}

void leerSensor() {
  int raw = analogRead(sensorPin);
  int humedad = map(raw, 0, 1023, 100, 0);

  debugPrint("Lectura cruda: " + String(raw) + " - Humedad: " + String(humedad) + " %");
  Blynk.virtualWrite(V2, humedad);
  enviarDatosIoT(humedad, !digitalRead(relayPin), modoAutomatico);

  if (modoAutomatico) {
    debugPrint("Modo automático activo, controlando bomba...");
    controlarBomba(humedad);
  }
}

void setup() {
  Serial.begin(115200);
  debugPrint("Iniciando sistema...");

  pinMode(sensorPin, INPUT);
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, HIGH);

  debugPrint("Conectando a WiFi: " + String(ssid));
  WiFi.begin(ssid, pass);
  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    debugPrint("Esperando conexión WiFi... Intento " + String(wifiTimeout + 1));
    wifiTimeout++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    debugPrint("Conectado a WiFi. IP: " + WiFi.localIP().toString());
    Blynk.config(auth);
    Blynk.connect();
  } else {
    debugPrint("Fallo al conectar a WiFi.");
  }

  timer.setInterval(1000L, leerSensor);
  debugPrint("Temporizador configurado.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && Blynk.connected()) {
    Blynk.run();
  } else {
    debugPrint("Blynk o WiFi no conectado. Intentando reconectar...");
    Blynk.connect();
  }
  timer.run();
}