# ESP32 Passenger Counting System

This ESP32 implementation provides driver session management and passenger counting functionality with RFID card support.

## Features

### Driver Session Management
- **RFID-based Session Control**: Drivers can start/end sessions by tapping their RFID cards
- **Session Persistence**: Session state survives device restarts
- **Driver Card Recognition**: Automatically distinguishes between driver and passenger cards
- **No Cooldown for Drivers**: Driver cards bypass the 5-minute cooldown restriction

### Passenger Recording
- **Session-based Recording**: Passengers can only be recorded during active sessions
- **Anti-duplicate System**: 5-minute cooldown prevents duplicate passenger recordings
- **Real-time Counting**: Live passenger count display on LCD

### Connectivity & Offline Support
- **WiFi Connectivity**: Full online integration with backend API
- **Offline Mode**: Continues operation when internet is unavailable
- **Automatic Sync**: Syncs offline data when connection is restored
- **Device Registration**: Automatically registers with backend on startup

### User Interface
- **LCD Display**: Shows session status, driver info, and passenger count
- **Audio Feedback**: Buzzer provides success/error sound indicators
- **LED Indicators**: Visual status for WiFi and session state
- **Real-time Updates**: Display updates every few seconds with current status

## Hardware Requirements

### Required Components
- **ESP32 Development Board** (DevKit v1 or similar)
- **MFRC522 RFID Reader Module**
- **16x2 LCD Display with I2C Backpack**
- **Passive Buzzer**
- **LEDs** (2x for status indicators)
- **Resistors** (330Ω for LEDs)
- **Breadboard and Jumper Wires**

### Pin Connections

#### MFRC522 RFID Reader
```
MFRC522    ESP32
VCC     -> 3.3V
RST     -> GPIO 22
GND     -> GND
MISO    -> GPIO 19
MOSI    -> GPIO 23
SCK     -> GPIO 18
SDA/SS  -> GPIO 21
```

#### I2C LCD Display
```
LCD I2C    ESP32
VCC     -> 5V
GND     -> GND
SDA     -> GPIO 21
SCL     -> GPIO 22
```

#### Audio and Visual Indicators
```
Component    ESP32
Buzzer    -> GPIO 23 (+ GND)
LED Online   -> GPIO 2 (+ 330Ω resistor + GND)
LED Session -> GPIO 4 (+ 330Ω resistor + GND)
```

## Software Setup

### 1. Arduino IDE Configuration
1. Install ESP32 board package in Arduino IDE
2. Select "ESP32 Dev Module" as the board

### 2. Required Libraries
Install these libraries through Arduino IDE Library Manager:
```
- WiFi (ESP32 built-in)
- HTTPClient (ESP32 built-in)
- ArduinoJson
- MFRC522
- LiquidCrystal_I2C
- SPIFFS (ESP32 built-in)
- Preferences (ESP32 built-in)
```

### 3. Configuration
Before uploading, modify these settings in the code:

```cpp
// WiFi Configuration
String wifiSSID = "YOUR_WIFI_SSID";
String wifiPassword = "YOUR_WIFI_PASSWORD";

// Backend API Configuration
String apiBaseURL = "http://your-backend-url/api";

// Device Configuration
String deviceID = "ESP32_001"; // Unique device identifier
```

### 4. Upload Process
1. Connect ESP32 to computer via USB
2. Select correct COM port in Arduino IDE
3. Upload the sketch
4. Open Serial Monitor (115200 baud) to view debug output

## Usage Instructions

### Initial Setup
1. Power on the ESP32
2. The device will attempt to connect to WiFi
3. If successful, it registers with the backend automatically
4. LCD will show "NO ACTIVE SESSION" when ready

### Driver Session Management

#### Starting a Session
1. Driver taps their RFID card on the reader
2. If online: Backend validates the driver and starts session
3. If offline: User must tap twice within 5 seconds to confirm
4. LCD shows "SESSION ACTIVE" with driver name
5. Green session LED turns on
6. Success sound plays

#### Ending a Session
1. Same driver taps their RFID card again
2. Session ends and passenger count is displayed
3. LCD shows session summary
4. Session LED turns off
5. System returns to "NO ACTIVE SESSION" state

### Passenger Recording
1. Ensure a driver session is active
2. Passenger taps their RFID card
3. System records the passenger and increments count
4. LCD shows updated passenger count
5. Success sound plays
6. 5-minute cooldown prevents duplicate recordings

### Status Indicators

#### LCD Display Modes
- **No Session**: "NO ACTIVE SESSION" / "Tap driver card"
- **Active Session**: Alternates between:
  - Driver name
  - Passenger count and vehicle number
- **Card Detection**: Shows detected RFID temporarily
- **Error Messages**: Shows specific error information

#### LED Indicators
- **Online LED (GPIO 2)**: Solid when WiFi connected
- **Session LED (GPIO 4)**: Solid when session active

#### Audio Feedback
- **Success**: Two short beeps
- **Error**: Three long beeps
- **Startup**: Five short beeps

### Offline Mode
When WiFi is unavailable:
- Device continues operating with stored session data
- New passenger records are stored locally
- Session management uses simplified offline logic
- Data syncs automatically when connection is restored
- LCD shows "OFF" indicator

## Troubleshooting

### Common Issues

#### WiFi Connection Failed
- Verify SSID and password in code
- Check WiFi signal strength
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

#### RFID Reader Not Working
- Check SPI connections (MISO, MOSI, SCK, SS)
- Verify 3.3V power supply
- Ensure RFID cards are compatible (13.56MHz)

#### LCD Not Displaying
- Check I2C connections (SDA, SCL)
- Verify LCD I2C address (default 0x27)
- Ensure 5V power for LCD

#### Backend Communication Issues
- Verify API URL configuration
- Check network connectivity
- Ensure backend is running and accessible
- Review Serial Monitor for HTTP error codes

### Serial Monitor Debug Output
Enable Serial Monitor (115200 baud) to see:
- WiFi connection status
- RFID card readings
- HTTP request/response details
- Session management events
- Error messages and codes

## API Integration

The ESP32 communicates with the backend using these endpoints:

### Session Management
```
POST /api/session/rfid
Body: {
  "rfid_code": "AA:BB:CC:DD",
  "device_id": "ESP32_001"
}
```

### Passenger Recording
```
POST /api/passenger/record
Body: {
  "rfid_code": "AA:BB:CC:DD", 
  "device_id": "ESP32_001"
}
```

### Device Registration
```
POST /api/device/register
Body: {
  "device_id": "ESP32_001",
  "status": "online"
}
```

## Data Storage

### Persistent Data (SPIFFS)
- Configuration settings
- System state (session info)
- Offline records queue

### Memory Structure
- **Config**: WiFi credentials, API URL, device settings
- **State**: Current session information, passenger count
- **Offline Records**: Up to 100 unsync'd records with timestamps

### Data Persistence
- Session state survives power cycles
- Offline data preserved until synced
- Configuration retained between updates

## Customization

### Timing Configuration
```cpp
unsigned long cooldownDuration = 300000;        // 5 minutes
unsigned long offlineRetryInterval = 30000;     // 30 seconds  
unsigned long sessionCheckInterval = 10000;     // 10 seconds
```

### Display Customization
- Modify `updateDisplay()` function for different layouts
- Adjust LCD refresh intervals
- Customize message formatting

### Audio Feedback
- Change buzzer patterns in sound functions
- Adjust tone duration and frequency
- Add new sound patterns for different events

### Storage Limits
```cpp
const int MAX_CARD_HISTORY = 50;        // Anti-duplicate tracking
const int MAX_OFFLINE_RECORDS = 100;    // Offline data storage
```

## Security Considerations

- RFID cards should be properly programmed and secured
- WiFi credentials are stored in ESP32 preferences (encrypted)
- Device authentication should be implemented in production
- Consider HTTPS for production deployments
- Implement card blacklisting for lost/stolen cards

## Maintenance

### Regular Tasks
- Monitor device connectivity status
- Check offline record sync status
- Verify RFID reader functionality
- Update WiFi credentials if changed

### Firmware Updates
- Use Arduino IDE for code updates
- Configuration persists through updates
- Session state preserved during updates
- Backup critical data before major changes