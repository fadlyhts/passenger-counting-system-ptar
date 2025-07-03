# Arduino Library Installation Guide

## Required Libraries for ESP32 Passenger Counting System

To compile and upload the ESP32 code, you need to install the following libraries in your Arduino IDE.

### 1. ESP32 Board Package
1. Open Arduino IDE
2. Go to **File > Preferences**
3. Add this URL to "Additional Board Manager URLs":
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to **Tools > Board > Boards Manager**
5. Search for "ESP32" and install "esp32 by Espressif Systems"
6. Select **Tools > Board > ESP32 Arduino > ESP32 Dev Module**

### 2. Required External Libraries

Install these libraries using **Sketch > Include Library > Manage Libraries**:

#### ArduinoJson
- **Name**: ArduinoJson
- **Author**: Benoit Blanchon
- **Version**: 6.21.0 or later
- **Description**: JSON parsing for HTTP communication with backend

```
Search: ArduinoJson
Install: ArduinoJson by Benoit Blanchon
```

#### MFRC522
- **Name**: MFRC522
- **Author**: GithubCommunity
- **Version**: 1.4.10 or later
- **Description**: RFID reader library for card detection

```
Search: MFRC522
Install: MFRC522 by GithubCommunity
```

#### LiquidCrystal_I2C
- **Name**: LiquidCrystal I2C
- **Author**: Frank de Brabander
- **Version**: 1.1.2 or later
- **Description**: I2C LCD display control

```
Search: LiquidCrystal I2C
Install: LiquidCrystal I2C by Frank de Brabander
```

### 3. Built-in ESP32 Libraries
These libraries are included with the ESP32 board package:

- **WiFi**: WiFi connectivity management
- **HTTPClient**: HTTP requests to backend API
- **SPI**: SPI communication for RFID reader
- **SPIFFS**: File system for local storage
- **Preferences**: Non-volatile storage for configuration

### 4. Library Installation Steps

#### Method 1: Library Manager (Recommended)
1. Open Arduino IDE
2. Go to **Sketch > Include Library > Manage Libraries**
3. Search for each library name
4. Click **Install** for each required library
5. Wait for installation to complete

#### Method 2: Manual Installation
If Library Manager doesn't work:

1. Download library ZIP files from GitHub:
   - [ArduinoJson](https://github.com/bblanchon/ArduinoJson/releases)
   - [MFRC522](https://github.com/miguelbalboa/rfid/releases)
   - [LiquidCrystal_I2C](https://github.com/johnrickman/LiquidCrystal_I2C/releases)

2. In Arduino IDE: **Sketch > Include Library > Add .ZIP Library**
3. Select each downloaded ZIP file
4. Restart Arduino IDE

### 5. Verification

To verify all libraries are installed correctly:

1. Open the ESP32 passenger counting system sketch
2. Go to **Sketch > Verify/Compile**
3. Check for any missing library errors
4. All libraries should compile without errors

### 6. Troubleshooting

#### Common Issues:

**"Library not found" errors:**
- Ensure correct library names and authors
- Try restarting Arduino IDE
- Check library installation path

**ESP32 board not found:**
- Verify ESP32 board package installation
- Check board selection in Tools menu
- Restart Arduino IDE after board package installation

**Compilation errors:**
- Verify library versions (use latest stable versions)
- Check for conflicting library installations
- Clear Arduino cache: delete `/tmp/arduino_*` folders

**Upload issues:**
- Select correct COM port
- Press and hold BOOT button during upload if needed
- Try different USB cable
- Check ESP32 driver installation

### 7. Library Versions Tested

This project has been tested with:

```
ESP32 Board Package: 2.0.11
ArduinoJson: 6.21.3
MFRC522: 1.4.10
LiquidCrystal_I2C: 1.1.2
```

### 8. Additional Tools

#### Serial Monitor Setup
- **Baud Rate**: 115200
- **Line Ending**: Both NL & CR
- Used for debugging and configuration

#### Board Settings
```
Board: ESP32 Dev Module
CPU Frequency: 240MHz
Flash Size: 4MB
Partition Scheme: Default 4MB with spiffs
Upload Speed: 921600
```

### 9. Development Environment

#### Recommended Arduino IDE Version
- **Arduino IDE 1.8.19** or later
- **Arduino IDE 2.x** also supported

#### Alternative Development Environments
- **PlatformIO**: Professional IDE with better dependency management
- **ESP-IDF**: Espressif's native development framework
- **VSCode with Arduino Extension**: Modern editor with Arduino support

### 10. Next Steps

After installing all libraries:

1. **Configure WiFi**: Update SSID and password in the code
2. **Set API URL**: Update backend server URL
3. **Upload Code**: Compile and upload to ESP32
4. **Test Hardware**: Verify RFID, LCD, and buzzer functionality
5. **Configure Backend**: Ensure device is registered in system

For complete setup instructions, see the main ESP32 README.md file.