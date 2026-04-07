#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHTesp.h>

const char *ssid = "Wokwi-GUEST";
const char *password = "";
const char *mqtt_server = "broker.emqx.io";
const int mqtt_port = 1883;

const char *TOPIC = "assignment12"; 
const int DHT_PIN = 14;

WiFiClient espClient;
PubSubClient client(espClient);
DHTesp dht;

unsigned long lastMsg = 0;

void setup_wifi() {
  Serial.print("Connecting WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.println(" OK!");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting MQTT...");
    String clientId = "ESP32-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println(" OK!");
    } else {
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.setup(DHT_PIN, DHTesp::DHT22);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > 3000) {
    lastMsg = now;
    
    float t = dht.getTemperature();
    if (!isnan(t)) {
      StaticJsonDocument<100> doc;
      doc["temp"] = String(t, 1);
      
      char buffer[100];
      serializeJson(doc, buffer);
      client.publish(TOPIC, buffer);
      
      Serial.print("ส่งอุณหภูมิ: ");
      Serial.println(t);
    }
  }
}