#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// Network credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server details
const char* serverUrl = "http://your-server-ip:3000/api/attendance";
const char* deviceId = "ESP32-001";

// RFID
#define SS_PIN    5  // ESP32 pin GPIO5 
#define RST_PIN   27 // ESP32 pin GPIO27
MFRC522 rfid(SS_PIN, RST_PIN);

// NTP Client for getting accurate time
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org");

// LED Pins
#define GREEN_LED 12
#define RED_LED   13
#define BUZZER    14

// Variables
String lastReadTag = "";
unsigned long lastReadTime = 0;
const int cooldownPeriod = 5000; // 5 seconds cooldown between readings

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nESP32 Attendance System");
  
  // Initialize LED pins
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Turn off all
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(BUZZER, LOW);
  
  // Initialize RFID reader
  SPI.begin();
  rfid.PCD_Init();
  Serial.print("RFID Reader: ");
  rfid.PCD_DumpVersionToSerial();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    // Blink red LED while connecting
    digitalWrite(RED_LED, !digitalRead(RED_LED));
  }
  
  digitalWrite(RED_LED, LOW);
  digitalWrite(GREEN_LED, HIGH);
  delay(1000);
  digitalWrite(GREEN_LED, LOW);
  
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Initialize time client
  timeClient.begin();
  timeClient.setTimeOffset(0); // Set your timezone offset in seconds
}

void loop() {
  // Update NTP client
  timeClient.update();
  
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    reconnectWiFi();
  }
  
  // Check if a new card is present
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    // Get current time
    unsigned long currentTime = millis();
    
    // Extract RFID tag ID
    String tagID = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      tagID.concat(String(rfid.uid.uidByte[i] < 0x10 ? "0" : ""));
      tagID.concat(String(rfid.uid.uidByte[i], HEX));
    }
    tagID.toUpperCase();
    
    // Check if it's a new tag or if enough time has passed
    if (tagID != lastReadTag || (currentTime - lastReadTime) > cooldownPeriod) {
      Serial.print("RFID Tag detected: ");
      Serial.println(tagID);
      
      // Update last read tag and time
      lastReadTag = tagID;
      lastReadTime = currentTime;
      
      // Send attendance data to server
      if (sendAttendanceData(tagID)) {
        // Success indication
        digitalWrite(GREEN_LED, HIGH);
        tone(BUZZER, 1000, 200);
        delay(1000);
        digitalWrite(GREEN_LED, LOW);
      } else {
        // Error indication
        digitalWrite(RED_LED, HIGH);
        tone(BUZZER, 400, 500);
        delay(1000);
        digitalWrite(RED_LED, LOW);
      }
    }
    
    // Halt PICC
    rfid.PICC_HaltA();
    // Stop encryption on PCD
    rfid.PCD_StopCrypto1();
  }
  
  delay(100);
}

bool sendAttendanceData(String rfidTag) {
  // Only proceed if WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send data.");
    return false;
  }
  
  HTTPClient http;
  
  Serial.print("Connecting to server: ");
  Serial.println(serverUrl);
  
  // Configure HTTP client
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON document
  StaticJsonDocument<200> doc;
  doc["studentId"] = rfidTag; // In a real system, you might map RFID to student ID
  doc["timestamp"] = timeClient.getFormattedDate();
  doc["deviceId"] = deviceId;
  
  // Serialize JSON
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.print("Sending JSON payload: ");
  Serial.println(jsonPayload);
  
  // Send the request
  int httpResponseCode = http.POST(jsonPayload);
  
  // Check response
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
    
    http.end();
    return true;
  } else {
    Serial.print("Error on HTTP request. Error code: ");
    Serial.println(httpResponseCode);
    
    http.end();
    return false;
  }
}

void reconnectWiFi() {
  // Attempt to reconnect to WiFi
  WiFi.disconnect();
  delay(1000);
  WiFi.begin(ssid, password);
  
  Serial.print("Reconnecting to WiFi");
  
  // Wait for reconnection with timeout
  int timeout = 0;
  while (WiFi.status() != WL_CONNECTED && timeout < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(RED_LED, !digitalRead(RED_LED));
    timeout++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(RED_LED, LOW);
    digitalWrite(GREEN_LED, HIGH);
    delay(1000);
    digitalWrite(GREEN_LED, LOW);
    
    Serial.println("");
    Serial.println("WiFi reconnected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("");
    Serial.println("Failed to reconnect to WiFi");
  }
}