/*
 * ESP32 Passenger Counting System with Driver Session Management
 * 
 * Features:
 * - RFID card reading with MFRC522
 * - WiFi connectivity with offline mode support
 * - Driver session management via RFID taps
 * - Passenger recording during active sessions
 * - LCD display for status and feedback
 * - Buzzer for audio feedback
 * - Local data storage using SPIFFS
 * - Anti-duplicate system with driver card exceptions
 * 
 * Hardware Requirements:
 * - ESP32 Dev Board
 * - MFRC522 RFID Reader
 * - 16x2 LCD Display (I2C)
 * - Buzzer
 * - LED indicators (optional)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <MFRC522.h>
#include <SPI.h>
#include <LiquidCrystal_I2C.h>
#include <SPIFFS.h>
#include <Preferences.h>

// Pin definitions
#define RST_PIN     22
#define SS_PIN      21
#define BUZZER_PIN  23
#define LED_ONLINE  2
#define LED_SESSION 4

// RFID Reader
MFRC522 mfrc522(SS_PIN, RST_PIN);

// LCD Display (16x2 with I2C)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Preferences for persistent storage
Preferences preferences;

// Configuration
struct Config {
  String wifiSSID = "YOUR_WIFI_SSID";
  String wifiPassword = "YOUR_WIFI_PASSWORD";
  String apiBaseURL = "http://your-backend-url/api";
  String deviceID = "ESP32_001";
  unsigned long cooldownDuration = 300000; // 5 minutes in milliseconds
  unsigned long offlineRetryInterval = 30000; // 30 seconds
  unsigned long sessionCheckInterval = 10000; // 10 seconds
};

Config config;

// System state
struct SystemState {
  bool wifiConnected = false;
  bool sessionActive = false;
  String currentDriverName = "";
  String currentDriverRFID = "";
  String currentMobilNumber = "";
  int sessionID = 0;
  int passengerCount = 0;
  unsigned long lastSyncTime = 0;
  unsigned long lastSessionCheck = 0;
  bool deviceOnline = false;
};

SystemState state;

// Card tracking for anti-duplicate
struct CardEntry {
  String rfid;
  unsigned long timestamp;
};

const int MAX_CARD_HISTORY = 50;
CardEntry cardHistory[MAX_CARD_HISTORY];
int cardHistoryIndex = 0;

// Offline data storage
const int MAX_OFFLINE_RECORDS = 100;
struct OfflineRecord {
  String rfid;
  unsigned long timestamp;
  String type; // "passenger" or "session_start" or "session_end"
  bool synced;
};

OfflineRecord offlineRecords[MAX_OFFLINE_RECORDS];
int offlineRecordCount = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32 Passenger Counting System...");
  
  // Initialize hardware
  initializeHardware();
  
  // Initialize SPIFFS
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS initialization failed!");
    displayError("Storage Error");
    return;
  }
  
  // Load configuration
  loadConfiguration();
  
  // Initialize WiFi
  initializeWiFi();
  
  // Load system state from preferences
  loadSystemState();
  
  // Initialize display
  updateDisplay();
  
  Serial.println("System initialized successfully!");
  playStartupSound();
}

void loop() {
  // Check WiFi connection
  checkWiFiConnection();
  
  // Check for RFID cards
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    handleRFIDCard();
  }
  
  // Periodic tasks
  if (millis() - state.lastSessionCheck > config.sessionCheckInterval) {
    syncWithBackend();
    state.lastSessionCheck = millis();
  }
  
  // Update display periodically
  updateDisplay();
  
  delay(100);
}

void initializeHardware() {
  // Initialize SPI and MFRC522
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  
  // Initialize pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_ONLINE, OUTPUT);
  pinMode(LED_SESSION, OUTPUT);
  
  // Turn off LEDs initially
  digitalWrite(LED_ONLINE, LOW);
  digitalWrite(LED_SESSION, LOW);
  
  Serial.println("Hardware initialized");
}

void loadConfiguration() {
  preferences.begin("config", false);
  
  // Load WiFi credentials if available
  if (preferences.isKey("wifiSSID")) {
    config.wifiSSID = preferences.getString("wifiSSID", config.wifiSSID);
  }
  if (preferences.isKey("wifiPass")) {
    config.wifiPassword = preferences.getString("wifiPass", config.wifiPassword);
  }
  if (preferences.isKey("apiURL")) {
    config.apiBaseURL = preferences.getString("apiURL", config.apiBaseURL);
  }
  if (preferences.isKey("deviceID")) {
    config.deviceID = preferences.getString("deviceID", config.deviceID);
  }
  
  preferences.end();
  
  Serial.println("Configuration loaded");
  Serial.println("Device ID: " + config.deviceID);
}

void loadSystemState() {
  preferences.begin("state", false);
  
  state.sessionActive = preferences.getBool("sessionActive", false);
  state.currentDriverName = preferences.getString("driverName", "");
  state.currentDriverRFID = preferences.getString("driverRFID", "");
  state.currentMobilNumber = preferences.getString("mobilNumber", "");
  state.sessionID = preferences.getInt("sessionID", 0);
  state.passengerCount = preferences.getInt("passengerCount", 0);
  
  preferences.end();
  
  Serial.println("System state loaded");
  if (state.sessionActive) {
    Serial.println("Active session found: " + state.currentDriverName);
  }
}

void saveSystemState() {
  preferences.begin("state", false);
  
  preferences.putBool("sessionActive", state.sessionActive);
  preferences.putString("driverName", state.currentDriverName);
  preferences.putString("driverRFID", state.currentDriverRFID);
  preferences.putString("mobilNumber", state.currentMobilNumber);
  preferences.putInt("sessionID", state.sessionID);
  preferences.putInt("passengerCount", state.passengerCount);
  
  preferences.end();
}

void initializeWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  
  WiFi.begin(config.wifiSSID.c_str(), config.wifiPassword.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    lcd.setCursor(attempts % 16, 1);
    lcd.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    state.wifiConnected = true;
    digitalWrite(LED_ONLINE, HIGH);
    Serial.println("\nWiFi connected!");
    Serial.println("IP address: " + WiFi.localIP().toString());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
    delay(2000);
    
    // Register device with backend
    registerDevice();
  } else {
    state.wifiConnected = false;
    digitalWrite(LED_ONLINE, LOW);
    Serial.println("\nWiFi connection failed - running in offline mode");
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("Offline Mode");
    delay(2000);
  }
}

void checkWiFiConnection() {
  bool previousState = state.wifiConnected;
  state.wifiConnected = (WiFi.status() == WL_CONNECTED);
  
  if (state.wifiConnected != previousState) {
    digitalWrite(LED_ONLINE, state.wifiConnected ? HIGH : LOW);
    
    if (state.wifiConnected) {
      Serial.println("WiFi reconnected");
      registerDevice();
      syncOfflineData();
    } else {
      Serial.println("WiFi disconnected");
      state.deviceOnline = false;
    }
  }
}

void registerDevice() {
  if (!state.wifiConnected) return;
  
  HTTPClient http;
  http.begin(config.apiBaseURL + "/device/register");
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = config.deviceID;
  doc["status"] = "online";
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode == 200 || httpResponseCode == 201) {
    state.deviceOnline = true;
    Serial.println("Device registered successfully");
  } else {
    Serial.println("Device registration failed: " + String(httpResponseCode));
  }
  
  http.end();
}

String readRFIDCard() {
  String rfidString = "";
  
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (i > 0) rfidString += ":";
    if (mfrc522.uid.uidByte[i] < 0x10) rfidString += "0";
    rfidString += String(mfrc522.uid.uidByte[i], HEX);
  }
  
  rfidString.toUpperCase();
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  return rfidString;
}

bool isCardInCooldown(String rfid) {
  unsigned long currentTime = millis();
  
  for (int i = 0; i < MAX_CARD_HISTORY; i++) {
    if (cardHistory[i].rfid == rfid) {
      if (currentTime - cardHistory[i].timestamp < config.cooldownDuration) {
        return true;
      }
    }
  }
  return false;
}

void addCardToHistory(String rfid) {
  cardHistory[cardHistoryIndex].rfid = rfid;
  cardHistory[cardHistoryIndex].timestamp = millis();
  cardHistoryIndex = (cardHistoryIndex + 1) % MAX_CARD_HISTORY;
}

void handleRFIDCard() {
  String rfid = readRFIDCard();
  Serial.println("RFID detected: " + rfid);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Card Detected");
  lcd.setCursor(0, 1);
  lcd.print(rfid.substring(0, 16));
  
  // Try to handle as driver session first
  if (handleDriverSession(rfid)) {
    return;
  }
  
  // Check cooldown for passenger cards
  if (isCardInCooldown(rfid)) {
    displayMessage("Card Cooldown", "Try again later", 2000);
    playErrorSound();
    return;
  }
  
  // Handle as passenger card
  if (handlePassengerRecord(rfid)) {
    addCardToHistory(rfid);
  }
}

bool handleDriverSession(String rfid) {
  if (state.wifiConnected && state.deviceOnline) {
    // Try online session management
    return handleDriverSessionOnline(rfid);
  } else {
    // Handle offline session management
    return handleDriverSessionOffline(rfid);
  }
}

bool handleDriverSessionOnline(String rfid) {
  HTTPClient http;
  http.begin(config.apiBaseURL + "/session/rfid");
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(1024);
  doc["rfid_code"] = rfid;
  doc["device_id"] = config.deviceID;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  String response = http.getString();
  
  if (httpResponseCode == 200) {
    // Parse response
    DynamicJsonDocument responseDoc(2048);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      String action = responseDoc["data"]["action"];
      auto sessionData = responseDoc["data"]["session"];
      
      if (action == "started") {
        state.sessionActive = true;
        state.currentDriverName = sessionData["driver"]["nama_driver"];
        state.currentDriverRFID = sessionData["driver"]["rfid_code"];
        state.currentMobilNumber = sessionData["mobil"]["nomor_mobil"];
        state.sessionID = sessionData["id"];
        state.passengerCount = sessionData["passenger_count"];
        
        digitalWrite(LED_SESSION, HIGH);
        saveSystemState();
        
        displayMessage("Session Started", state.currentDriverName, 3000);
        playSuccessSound();
        
        Serial.println("Session started for: " + state.currentDriverName);
        
      } else if (action == "ended") {
        displayMessage("Session Ended", state.currentDriverName + " " + String(state.passengerCount) + " passengers", 3000);
        playSuccessSound();
        
        Serial.println("Session ended. Passengers: " + String(state.passengerCount));
        
        // Reset session state
        state.sessionActive = false;
        state.currentDriverName = "";
        state.currentDriverRFID = "";
        state.currentMobilNumber = "";
        state.sessionID = 0;
        state.passengerCount = 0;
        
        digitalWrite(LED_SESSION, LOW);
        saveSystemState();
      }
      
      http.end();
      return true;
    }
  }
  
  // If we get here, it's not a driver card or there was an error
  http.end();
  return false;
}

bool handleDriverSessionOffline(String rfid) {
  // In offline mode, we can't verify if it's a driver card
  // So we'll assume any new RFID could be a driver trying to start/end session
  // This is a simplified offline implementation
  
  if (state.sessionActive && rfid == state.currentDriverRFID) {
    // Same driver card tapped - end session
    storeOfflineRecord(rfid, "session_end");
    
    displayMessage("Session Ended", state.currentDriverName + " OFFLINE", 3000);
    playSuccessSound();
    
    // Reset session state
    state.sessionActive = false;
    state.currentDriverName = "";
    state.currentDriverRFID = "";
    state.currentMobilNumber = "";
    state.sessionID = 0;
    state.passengerCount = 0;
    
    digitalWrite(LED_SESSION, LOW);
    saveSystemState();
    
    return true;
  } else if (!state.sessionActive) {
    // No active session - could be driver starting session
    // In offline mode, we'll prompt for session start
    displayMessage("Offline Mode", "Tap again to start", 3000);
    
    // Wait for second tap within 5 seconds
    unsigned long waitStart = millis();
    while (millis() - waitStart < 5000) {
      if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
        String secondRfid = readRFIDCard();
        if (secondRfid == rfid) {
          // Same card tapped twice - start session
          storeOfflineRecord(rfid, "session_start");
          
          state.sessionActive = true;
          state.currentDriverRFID = rfid;
          state.currentDriverName = "Driver " + rfid.substring(0, 4);
          state.passengerCount = 0;
          
          digitalWrite(LED_SESSION, HIGH);
          saveSystemState();
          
          displayMessage("Session Started", "Offline Mode", 3000);
          playSuccessSound();
          
          return true;
        }
      }
      delay(100);
    }
  }
  
  return false;
}

bool handlePassengerRecord(String rfid) {
  if (!state.sessionActive) {
    displayMessage("No Session", "Driver must login", 2000);
    playErrorSound();
    return false;
  }
  
  if (state.wifiConnected && state.deviceOnline) {
    return handlePassengerRecordOnline(rfid);
  } else {
    return handlePassengerRecordOffline(rfid);
  }
}

bool handlePassengerRecordOnline(String rfid) {
  HTTPClient http;
  http.begin(config.apiBaseURL + "/passenger/record");
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(1024);
  doc["rfid_code"] = rfid;
  doc["device_id"] = config.deviceID;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  String response = http.getString();
  
  if (httpResponseCode == 201) {
    // Parse response
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      state.passengerCount = responseDoc["data"]["passenger_count"];
      saveSystemState();
      
      displayMessage("Passenger Added", "Count: " + String(state.passengerCount), 2000);
      playSuccessSound();
      
      Serial.println("Passenger recorded. Total: " + String(state.passengerCount));
      
      http.end();
      return true;
    }
  } else {
    // Handle errors
    DynamicJsonDocument errorDoc(512);
    deserializeJson(errorDoc, response);
    String errorMsg = errorDoc["message"];
    
    displayMessage("Error", errorMsg.substring(0, 16), 2000);
    playErrorSound();
  }
  
  http.end();
  return false;
}

bool handlePassengerRecordOffline(String rfid) {
  storeOfflineRecord(rfid, "passenger");
  
  state.passengerCount++;
  saveSystemState();
  
  displayMessage("Passenger Added", "Count: " + String(state.passengerCount) + " OFF", 2000);
  playSuccessSound();
  
  Serial.println("Passenger recorded offline. Total: " + String(state.passengerCount));
  
  return true;
}

void storeOfflineRecord(String rfid, String type) {
  if (offlineRecordCount < MAX_OFFLINE_RECORDS) {
    offlineRecords[offlineRecordCount].rfid = rfid;
    offlineRecords[offlineRecordCount].timestamp = millis();
    offlineRecords[offlineRecordCount].type = type;
    offlineRecords[offlineRecordCount].synced = false;
    offlineRecordCount++;
    
    Serial.println("Stored offline record: " + type + " - " + rfid);
  } else {
    Serial.println("Offline storage full!");
    displayMessage("Storage Full", "Sync required", 2000);
  }
}

void syncOfflineData() {
  if (!state.wifiConnected || !state.deviceOnline) return;
  
  Serial.println("Syncing offline data...");
  
  for (int i = 0; i < offlineRecordCount; i++) {
    if (!offlineRecords[i].synced) {
      bool success = false;
      
      if (offlineRecords[i].type == "passenger") {
        success = syncOfflinePassenger(offlineRecords[i]);
      } else if (offlineRecords[i].type == "session_start" || offlineRecords[i].type == "session_end") {
        success = syncOfflineSession(offlineRecords[i]);
      }
      
      if (success) {
        offlineRecords[i].synced = true;
      }
    }
  }
  
  // Remove synced records
  int newCount = 0;
  for (int i = 0; i < offlineRecordCount; i++) {
    if (!offlineRecords[i].synced) {
      offlineRecords[newCount] = offlineRecords[i];
      newCount++;
    }
  }
  offlineRecordCount = newCount;
  
  Serial.println("Offline sync completed");
}

bool syncOfflinePassenger(OfflineRecord record) {
  HTTPClient http;
  http.begin(config.apiBaseURL + "/passenger/record");
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(1024);
  doc["rfid_code"] = record.rfid;
  doc["device_id"] = config.deviceID;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  bool success = (httpResponseCode == 201);
  
  http.end();
  return success;
}

bool syncOfflineSession(OfflineRecord record) {
  HTTPClient http;
  http.begin(config.apiBaseURL + "/session/rfid");
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(1024);
  doc["rfid_code"] = record.rfid;
  doc["device_id"] = config.deviceID;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  bool success = (httpResponseCode == 200);
  
  http.end();
  return success;
}

void syncWithBackend() {
  if (!state.wifiConnected || !state.deviceOnline) return;
  
  // Update device status
  HTTPClient http;
  http.begin(config.apiBaseURL + "/device/heartbeat");
  http.addHeader("Content-Type", "application/json");
  
  DynamicJsonDocument doc(512);
  doc["device_id"] = config.deviceID;
  doc["status"] = "online";
  doc["session_active"] = state.sessionActive;
  doc["passenger_count"] = state.passengerCount;
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  int httpResponseCode = http.POST(requestBody);
  
  if (httpResponseCode == 200) {
    state.lastSyncTime = millis();
  }
  
  http.end();
  
  // Sync offline data if any
  if (offlineRecordCount > 0) {
    syncOfflineData();
  }
}

void updateDisplay() {
  static unsigned long lastUpdate = 0;
  static int displayMode = 0;
  
  if (millis() - lastUpdate > 3000) {
    lcd.clear();
    
    if (state.sessionActive) {
      if (displayMode == 0) {
        lcd.setCursor(0, 0);
        lcd.print("SESSION ACTIVE");
        lcd.setCursor(0, 1);
        lcd.print(state.currentDriverName.substring(0, 16));
      } else {
        lcd.setCursor(0, 0);
        lcd.print("Passengers: " + String(state.passengerCount));
        lcd.setCursor(0, 1);
        lcd.print(state.currentMobilNumber + (state.wifiConnected ? " ON" : " OFF"));
      }
      displayMode = (displayMode + 1) % 2;
    } else {
      lcd.setCursor(0, 0);
      lcd.print("NO ACTIVE SESSION");
      lcd.setCursor(0, 1);
      lcd.print("Tap driver card" + String(state.wifiConnected ? "" : " OFF"));
    }
    
    lastUpdate = millis();
  }
}

void displayMessage(String line1, String line2, int duration) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
  delay(duration);
}

void displayError(String error) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ERROR:");
  lcd.setCursor(0, 1);
  lcd.print(error);
  playErrorSound();
}

void playSuccessSound() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(50);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

void playErrorSound() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
}

void playStartupSound() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(50);
    digitalWrite(BUZZER_PIN, LOW);
    delay(50);
  }
}