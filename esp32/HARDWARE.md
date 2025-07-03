# Hardware Setup Guide

## Component List

### Core Components
- 1x ESP32 Development Board (DevKit v1 recommended)
- 1x MFRC522 RFID Reader Module  
- 1x 16x2 LCD Display with I2C Backpack
- 1x Passive Buzzer (5V)
- 2x LEDs (any color, 5mm)
- 2x 330Ω Resistors
- 1x Breadboard (half-size minimum)
- Jumper wires (male-to-male, male-to-female)

### Optional Components
- 1x Enclosure/Case
- 1x Power supply (5V/2A recommended)
- Standoffs and screws for mounting
- Heat shrink tubing for wire management

## Wiring Diagram

```
ESP32 DevKit v1 Pinout and Connections:

                     ┌─────────────────┐
                 3V3 │1              30│ GPIO23 (MOSI) ───┐
                     │                 │                  │
                 EN  │2              29│ GPIO22 (LCD SCL) │
                     │                 │                  │
          SENSOR_VP  │3              28│ GPIO1 (TX)       │
                     │                 │                  │
          SENSOR_VN  │4              27│ GPIO3 (RX)       │
                     │                 │                  │
             GPIO32  │5              26│ GPIO21 (SDA)     │
                     │                 │                  │
             GPIO33  │6              25│ GPIO19 (MISO)    │
                     │                 │                  │
             GPIO25  │7              24│ GPIO18 (SCK)     │
                     │                 │                  │
             GPIO26  │8              23│ GPIO5            │
                     │                 │                  │
             GPIO27  │9              22│ GPIO17           │
                     │                 │                  │
             GPIO14  │10             21│ GPIO16           │
                     │                 │                  │
             GPIO12  │11             20│ GPIO4 (LED2)     │
                     │                 │                  │
                GND  │12             19│ GPIO0            │
                     │                 │                  │
             GPIO13  │13             18│ GPIO2 (LED1)     │
                     │                 │                  │
              GPIO9  │14             17│ GPIO15           │
                     │                 │                  │
             GPIO10  │15             16│ GPIO8            │
                     └─────────────────┘

Pin Assignments Used:
- GPIO21: I2C SDA (LCD), RFID SS/SDA
- GPIO22: I2C SCL (LCD), RFID RST  
- GPIO23: SPI MOSI (RFID), Buzzer
- GPIO19: SPI MISO (RFID)
- GPIO18: SPI SCK (RFID)
- GPIO2:  Online Status LED
- GPIO4:  Session Status LED
```

## Connection Details

### MFRC522 RFID Reader
```
MFRC522 Pin   →   ESP32 Pin   →   Wire Color (Suggested)
VCC (3.3V)    →   3V3          →   Red
GND           →   GND          →   Black  
RST           →   GPIO22       →   Yellow
SDA/SS        →   GPIO21       →   Green
MOSI          →   GPIO23       →   Blue
MISO          →   GPIO19       →   Purple
SCK           →   GPIO18       →   Orange
```

### I2C LCD Display (16x2)
```
LCD I2C Pin   →   ESP32 Pin   →   Wire Color (Suggested)
VCC (5V)      →   VIN          →   Red
GND           →   GND          →   Black
SDA           →   GPIO21       →   Blue  
SCL           →   GPIO22       →   Yellow
```

### Status LEDs
```
Component     →   ESP32 Pin   →   Connection
LED1 (Online) →   GPIO2       →   Anode → GPIO2, Cathode → 330Ω → GND
LED2 (Session)→   GPIO4       →   Anode → GPIO4, Cathode → 330Ω → GND
```

### Buzzer
```
Component     →   ESP32 Pin   →   Connection  
Buzzer (+)    →   GPIO23      →   Positive terminal
Buzzer (-)    →   GND         →   Negative terminal
```

## Breadboard Layout

```
Power Rails:
+ Rail: Connected to ESP32 VIN (5V) and 3V3
- Rail: Connected to ESP32 GND

Section A (Left): RFID Module
- MFRC522 positioned with pins accessible
- VCC to + rail (3V3 section)
- GND to - rail
- Data pins to ESP32 GPIO pins as specified

Section B (Center): ESP32
- ESP32 positioned centrally
- Power connections to rails
- GPIO connections to other components

Section C (Right): Display and Indicators  
- LCD I2C positioned at top
- LEDs with resistors at bottom
- Buzzer positioned conveniently
- All GND connections to - rail
```

## Assembly Steps

### 1. Prepare the Breadboard
1. Insert ESP32 into breadboard center
2. Connect power rails:
   - + rail to ESP32 VIN (5V input)
   - + rail to ESP32 3V3 (3.3V output)  
   - - rail to ESP32 GND

### 2. Install RFID Reader
1. Position MFRC522 on left side of breadboard
2. Connect power: VCC → 3V3, GND → GND
3. Connect SPI data lines as per pin assignment
4. Verify all connections are secure

### 3. Install LCD Display
1. Position LCD I2C module above breadboard
2. Connect power: VCC → 5V (VIN), GND → GND
3. Connect I2C: SDA → GPIO21, SCL → GPIO22
4. Test display by uploading a simple I2C scanner

### 4. Install Status LEDs
1. Insert LEDs into breadboard
2. Connect anodes to GPIO2 and GPIO4 respectively
3. Connect cathodes through 330Ω resistors to GND
4. Test with simple blink sketch

### 5. Install Buzzer
1. Position buzzer near ESP32
2. Connect positive terminal to GPIO23
3. Connect negative terminal to GND
4. Test with simple tone sketch

### 6. Final Assembly Check
1. Double-check all connections against pin assignments
2. Verify no short circuits between power rails
3. Ensure all components are firmly connected
4. Test continuity with multimeter if available

## Power Requirements

### Power Consumption Estimates
- ESP32: ~240mA (WiFi active), ~80mA (WiFi sleep)
- MFRC522: ~13mA (idle), ~26mA (reading)
- LCD I2C: ~20mA (backlight on)
- LEDs: ~20mA each (when on)
- Buzzer: ~30mA (when active)

**Total Peak Consumption: ~350mA**
**Recommended Supply: 5V/2A** (provides comfortable headroom)

### Power Supply Options
1. **USB Power**: Connect ESP32 via USB cable (development/testing)
2. **External Supply**: 5V wall adapter connected to VIN pin
3. **Battery Pack**: 4x AA batteries (6V) with voltage regulator
4. **Power Bank**: Portable USB power bank for mobile use

## Enclosure Considerations

### Recommended Enclosure Size
- Minimum: 150mm x 100mm x 50mm
- Optimal: 200mm x 120mm x 60mm

### Required Openings
- LCD display window (71mm x 24mm minimum)
- RFID reader access (module flush with case front)
- Power cable entry
- LED indicator holes (5mm diameter)
- Buzzer sound holes (multiple small holes)
- Reset button access (optional)

### Mounting Points
- ESP32: Standoffs at mounting holes
- LCD: Friction fit or small screws
- RFID: Flush mount with front panel
- Breadboard: Adhesive backing or standoffs

## Testing Procedure

### 1. Power-On Test
1. Connect power to ESP32
2. Verify power LED illuminates
3. Check voltage levels: 3.3V and 5V rails
4. Listen for startup sound sequence

### 2. Communication Test
1. Upload test sketch with Serial output
2. Verify WiFi connection attempts
3. Check I2C communication with LCD
4. Test SPI communication with RFID reader

### 3. Component Test
1. **LCD**: Display test messages
2. **RFID**: Read test cards and display UIDs
3. **LEDs**: Cycle through on/off states
4. **Buzzer**: Play different tone patterns

### 4. Integration Test
1. Upload full passenger counting firmware
2. Test driver session start/end with RFID
3. Test passenger recording functionality
4. Verify online/offline mode switching
5. Test persistence through power cycles

## Troubleshooting Hardware Issues

### ESP32 Won't Start
- Check power connections and voltage levels
- Verify EN pin is not grounded
- Try different USB cable/power supply
- Check for short circuits

### RFID Reader Not Working
- Verify SPI connections (MISO, MOSI, SCK, SS)
- Check 3.3V power supply (not 5V!)
- Test with known-good RFID cards
- Verify correct pin assignments in code

### LCD Display Issues
- Check I2C address (use I2C scanner sketch)
- Verify power connections (5V for most modules)
- Test SDA/SCL connections and pullup resistors
- Try different I2C clock speeds

### LED/Buzzer Problems
- Check GPIO pin assignments
- Verify current-limiting resistors for LEDs
- Test with simple digitalWrite commands
- Check for sufficient power supply current

### Intermittent Issues
- Check loose connections on breadboard
- Verify adequate power supply capacity
- Look for electromagnetic interference
- Consider power supply decoupling capacitors

## Maintenance

### Regular Checks
- Inspect solder joints and connections
- Clean RFID reader antenna surface
- Check LCD display for pixel degradation
- Verify enclosure integrity and mounting

### Preventive Measures
- Use quality components and connections
- Implement proper strain relief for cables
- Consider conformal coating for harsh environments
- Regular firmware updates and testing