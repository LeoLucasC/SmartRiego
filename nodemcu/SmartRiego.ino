#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

const char* ssid = "TU_SSID";
const char* password = "TU_CONTRASEÑA";
const char* server = "http://192.168.1.X:5000/data"; // Cambia por la IP de tu servidor

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConectado a WiFi");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;
    http.begin(client, server);

    // Ejemplo: enviar datos de un sensor de humedad (simulado)
    float humidity = random(30, 90); // Simula un valor de humedad
    String payload = "{\"humidity\":" + String(humidity) + "}";

    http.addHeader("Content-Type", "application/json");
    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      Serial.printf("Respuesta del servidor: %d\n", httpCode);
      Serial.println(http.getString());
    } else {
      Serial.println("Error en la solicitud HTTP");
    }
    http.end();
  }
  delay(10000); // Enviar datos cada 10 segundos
}