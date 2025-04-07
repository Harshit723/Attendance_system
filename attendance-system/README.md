# ESP32 Attendance System

A comprehensive attendance system using ESP32 microcontrollers with RFID readers to track student attendance in real-time.

## Features

- ✅ Real-time attendance tracking using ESP32 and RFID technology
- ✅ Beautiful web dashboard to monitor attendance records
- ✅ Student management system
- ✅ Device management for multiple ESP32 units
- ✅ Filtering and searching attendance records
- ✅ Real-time notifications via WebSockets
- ✅ Responsive design for desktop and mobile devices

## System Components

1. **Web Server**: Node.js application serving the web interface and API endpoints
2. **Frontend**: HTML/CSS/JavaScript web application
3. **ESP32 Hardware**: ESP32 microcontroller with RFID-RC522 module

## Prerequisites

- Node.js (v14+ recommended)
- npm (comes with Node.js)
- Arduino IDE (for ESP32 programming)
- ESP32 development board
- RFID-RC522 module
- LEDs (green, red) and a buzzer (optional for feedback)

## Directory Structure

```
attendance-system/
├── public/             # Frontend static files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── img/            # Images
├── server/             # Backend server code
│   └── index.js        # Main server file
├── esp32/              # ESP32 Arduino code
│   └── attendance_system.ino  # ESP32 firmware
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## Setup Instructions

### Server Setup

1. Clone this repository:
   ```
   git clone <repository-url>
   cd attendance-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. The server will be running at http://localhost:3000

### ESP32 Setup

1. Open the Arduino IDE and install the following libraries:
   - WiFi
   - HTTPClient
   - SPI
   - MFRC522 (for RFID communication)
   - ArduinoJson
   - NTPClient
   - WiFiUdp

2. Open the `esp32/attendance_system.ino` file in Arduino IDE

3. Update the following variables in the code:
   ```cpp
   // Network credentials
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   
   // Server details
   const char* serverUrl = "http://your-server-ip:3000/api/attendance";
   const char* deviceId = "ESP32-001";
   ```

4. Connect your ESP32 board with the following wiring:

   **RFID-RC522 to ESP32:**
   - RST -> GPIO27
   - SDA(SS) -> GPIO5
   - MOSI -> GPIO23
   - MISO -> GPIO19
   - SCK -> GPIO18
   - GND -> GND
   - 3.3V -> 3.3V

   **LEDs and Buzzer:**
   - Green LED -> GPIO12
   - Red LED -> GPIO13
   - Buzzer -> GPIO14

5. Upload the code to your ESP32 board

6. Open the serial monitor (115200 baud) to verify that the ESP32 connects to WiFi and initializes the RFID reader

## Using the System

1. **Dashboard**: The main screen showing summary of attendance, recent activity, and system status.

2. **Student Management**: Register students with their details and RFID tag IDs.
   - Click "Add Student" to register a new student
   - Enter student details including the RFID tag ID
   
3. **Attendance Records**: View, filter, and search attendance records.
   - Filter by date or student
   - Export attendance reports (future feature)

4. **Device Management**: Monitor and manage connected ESP32 devices.
   - View device status (online/offline)
   - Add new devices to the system

## How It Works

1. When a student places their RFID card near the ESP32's RFID reader, the ESP32 reads the card's unique ID.

2. The ESP32 sends this ID, along with the timestamp and device ID, to the server via an HTTP POST request.

3. The server records the attendance and broadcasts the information to all connected web clients using WebSockets.

4. The web interface updates in real-time to show the new attendance record.

## Security Considerations

- This is a demonstration project. In a production environment, consider:
  - Implementing HTTPS for secure communication
  - Adding proper authentication for API endpoints
  - Encrypting sensitive information
  - Adding user accounts with proper access control

## Future Enhancements

- Export attendance reports as CSV/PDF
- Email/SMS notifications for absent students
- Integration with existing student management systems
- Mobile app for monitoring
- Face recognition as an alternative to RFID

## Troubleshooting

**ESP32 not connecting to WiFi:**
- Verify SSID and password
- Check if the ESP32 is within range of the WiFi network

**ESP32 not sending data to server:**
- Verify server URL is correct and the server is running
- Check if the ESP32 can reach the server (network connectivity)
- Verify the server's firewall allows incoming connections

**RFID reader not detecting cards:**
- Check wiring connections
- Verify the RFID card is compatible with the RC522 module

## License

This project is licensed under the MIT License - see the LICENSE file for details.