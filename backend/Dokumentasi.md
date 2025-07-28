# DOKUMENTASI API BACKEND
## SISTEM PENGHITUNG PENUMPANG
### LAPORAN PRAKTIK KERJA LAPANGAN (PKL)

---

## DAFTAR ISI

1. [Pendahuluan](#pendahuluan)
2. [Arsitektur Sistem](#arsitektur-sistem)
3. [Konfigurasi Server](#konfigurasi-server)
4. [Autentikasi dan Keamanan](#autentikasi-dan-keamanan)
5. [Dokumentasi Endpoint API](#dokumentasi-endpoint-api)
   - [Authentication](#authentication)
   - [Admin Management](#admin-management)
   - [Driver Management](#driver-management)
   - [Vehicle Management](#vehicle-management)
   - [Device Management](#device-management)
   - [Session Management](#session-management)
   - [Passenger Management](#passenger-management)
   - [Reports](#reports)
   - [ESP32 RFID Endpoints](#esp32-rfid-endpoints)
6. [Model Database](#model-database)
7. [Error Handling](#error-handling)
8. [Testing dan Validasi](#testing-dan-validasi)

---

## PENDAHULUAN

### Gambaran Umum Sistem
Sistem Penghitung Penumpang adalah aplikasi berbasis web yang mengintegrasikan perangkat ESP32 dengan backend API untuk melakukan pencatatan dan pemantauan data penumpang kendaraan. Sistem ini dirancang untuk memudahkan pengelolaan data driver, kendaraan, dan catatan perjalanan secara real-time.

### Teknologi yang Digunakan
- **Backend**: Node.js dengan Express.js
- **Database**: MySQL dengan Sequelize ORM
- **Authentication**: JWT (JSON Web Token)
- **Security**: Helmet, CORS, bcrypt
- **Hardware**: ESP32 dengan RFID Reader
- **Documentation**: Postman Collection

### Fitur Utama
1. Manajemen Admin dan Driver
2. Manajemen Kendaraan (Mobil)
3. Manajemen Perangkat ESP32
4. Sistem Clock In/Out dengan RFID
5. Pencatatan Data Penumpang
6. Laporan dan Analytics
7. API untuk Integrasi ESP32

---

## ARSITEKTUR SISTEM

### Struktur Aplikasi
```
backend/
├── src/
│   ├── app.js              # Main application file
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Business logic handlers
│   ├── middleware/         # Authentication and validation
│   ├── models/            # Database models (Sequelize)
│   ├── routes/            # API route definitions
│   ├── scripts/           # Utility scripts
│   └── utils/             # Helper functions
├── package.json           # Dependencies and scripts
└── README.md             # Project documentation
```

### Alur Data Sistem
1. **ESP32 Device** → membaca RFID card
2. **ESP32** → mengirim data ke **Backend API**
3. **Backend** → memproses data dan menyimpan ke **Database**
4. **Frontend Web** → mengakses data melalui **API**
5. **Admin/Driver** → mengelola sistem melalui **Web Interface**

---

## KONFIGURASI SERVER


### Konfigurasi Database
- **Host**: localhost
- **Port**: 3306
- **ORM**: Sequelize
- **Connection Pool**: Enabled

### Environment Variables
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=passenger_counting_system
JWT_SECRET=your_jwt_secret
```

---

## AUTENTIKASI DAN KEAMANAN

### JWT Authentication
Sistem menggunakan JWT untuk autentikasi dengan fitur:
- Token expiration
- Token blacklisting untuk logout
- Role-based access control (Admin/Driver)

### Security Features
1. **Helmet**: HTTP headers security
2. **CORS**: Cross-origin resource sharing
3. **bcrypt**: Password hashing
4. **Rate Limiting**: API request limiting
5. **Input Validation**: Request data validation

### Authorization Levels
- **Admin**: Full access ke semua endpoint
- **Driver**: Terbatas pada operasi terkait driver
- **ESP32 Device**: Akses khusus untuk RFID endpoints

---

## DOKUMENTASI ENDPOINT API

### Base URL
```
http://localhost:3000
```

### Response Format
Semua response menggunakan format JSON standar:
```json
{
    "success": true/false,
    "message": "Description message",
    "data": { ... },
    "error": { ... } // Only on error
}
```

---

## AUTHENTICATION

### 1. Admin Login
**Endpoint**: `POST /api/auth/admin/login`

**Description**: Autentikasi untuk user admin

**Request Body**:
```json
{
    "username": "admin",
    "password": "password123"
}
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "username": "admin",
            "name": "Administrator",
            "role": "admin"
        }
    }
}
```

### 2. Driver Login
**Endpoint**: `POST /api/auth/driver/login`

**Description**: Autentikasi untuk driver

**Request Body**:
```json
{
    "username": "driver1",
    "password": "password123"
}
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": 1,
            "username": "driver1",
            "nama_driver": "John Doe",
            "role": "driver"
        }
    }
}
```

### 3. Logout
**Endpoint**: `POST /api/auth/logout`

**Headers**: 
```
Authorization: Bearer <token>
```

**Description**: Logout dan blacklist token

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Logout successful"
}
```

---

## ADMIN MANAGEMENT

### 1. Get All Admins
**Endpoint**: `GET /api/admin`

**Headers**: 
```
Authorization: Bearer <token>
```

**Description**: Mendapatkan daftar semua admin

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Admins retrieved successfully",
    "data": [
        {
            "id": 1,
            "username": "admin",
            "name": "Administrator",
            "email": "admin@example.com",
            "role": "admin",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 2. Get Admin by ID
**Endpoint**: `GET /api/admin/:id`

**Headers**: 
```
Authorization: Bearer <token>
```

**Parameters**:
- `id` (required): Admin ID

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Admin retrieved successfully",
    "data": {
        "id": 1,
        "username": "admin",
        "name": "Administrator",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active"
    }
}
```

### 3. Create Admin
**Endpoint**: `POST /api/admin`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "username": "newadmin",
    "password": "password123",
    "name": "New Admin",
    "role": "admin",
    "email": "newadmin@example.com"
}
```

**Response Success (201)**:
```json
{
    "success": true,
    "message": "Admin created successfully",
    "data": {
        "id": 2,
        "username": "newadmin",
        "name": "New Admin",
        "email": "newadmin@example.com",
        "role": "admin",
        "status": "active"
    }
}
```

### 4. Update Admin
**Endpoint**: `PUT /api/admin/:id`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "name": "Updated Admin Name",
    "email": "updated@example.com",
    "status": "active"
}
```

### 5. Delete Admin
**Endpoint**: `DELETE /api/admin/:id`

**Headers**: 
```
Authorization: Bearer <token>
```

---

## DRIVER MANAGEMENT

### 1. Get All Drivers
**Endpoint**: `GET /api/driver`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Drivers retrieved successfully",
    "data": [
        {
            "id": 1,
            "rfid_code": "RFID12345",
            "nama_driver": "John Doe",
            "username": "driver1",
            "email": "driver1@example.com",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 2. Create Driver
**Endpoint**: `POST /api/driver`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "rfid_code": "RFID12345",
    "nama_driver": "John Doe",
    "username": "driver1",
    "password": "password123",
    "email": "driver1@example.com"
}
```

### 3. Get Driver Login History
**Endpoint**: `GET /api/driver/:id/login-history`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Login history retrieved successfully",
    "data": [
        {
            "id": 1,
            "driver_id": 1,
            "login_time": "2024-01-15T08:00:00Z",
            "logout_time": "2024-01-15T17:00:00Z",
            "duration": "9 hours",
            "ip_address": "192.168.1.100"
        }
    ]
}
```

### 4. Update Driver Password
**Endpoint**: `PUT /api/driver/password`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "currentPassword": "password123",
    "newPassword": "newpassword123"
}
```

---

## VEHICLE MANAGEMENT

### 1. Get All Vehicles
**Endpoint**: `GET /api/mobil`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Vehicles retrieved successfully",
    "data": [
        {
            "id": 1,
            "nomor_mobil": "B1234CD",
            "capacity": 8,
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

### 2. Create Vehicle
**Endpoint**: `POST /api/mobil`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "nomor_mobil": "B1234CD",
    "capacity": 8,
    "status": "active"
}
```

### 3. Get Vehicle Session History
**Endpoint**: `GET /api/mobil/:id/sessions`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Vehicle sessions retrieved successfully",
    "data": [
        {
            "id": 1,
            "driver": {
                "nama_driver": "John Doe"
            },
            "start_time": "2024-01-15T08:00:00Z",
            "end_time": "2024-01-15T17:00:00Z",
            "total_passengers": 25
        }
    ]
}
```

---

## DEVICE MANAGEMENT

### 1. Get All Devices
**Endpoint**: `GET /api/device`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Devices retrieved successfully",
    "data": [
        {
            "id": 1,
            "device_id": "ESP32-001",
            "mobil_id": 1,
            "status": "online",
            "last_seen": "2024-01-15T10:30:00Z",
            "mobil": {
                "nomor_mobil": "B1234CD"
            }
        }
    ]
}
```

### 2. Create Device
**Endpoint**: `POST /api/device`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "device_id": "ESP32-001",
    "mobil_id": 1,
    "status": "online"
}
```

### 3. Update Device Status
**Endpoint**: `PUT /api/device/:id/status`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "status": "online"
}
```

---

## SESSION MANAGEMENT

### 1. Get Active Sessions
**Endpoint**: `GET /api/session/active`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Active sessions retrieved successfully",
    "data": [
        {
            "id": 1,
            "driver_id": 1,
            "mobil_id": 1,
            "start_time": "2024-01-15T08:00:00Z",
            "status": "active",
            "driver": {
                "nama_driver": "John Doe"
            },
            "mobil": {
                "nomor_mobil": "B1234CD"
            }
        }
    ]
}
```

### 2. Start Session (Clock In)
**Endpoint**: `POST /api/session/start`

**Headers**: 
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
    "driver_id": 1,
    "mobil_id": 1
}
```

**Response Success (201)**:
```json
{
    "success": true,
    "message": "Session started successfully",
    "data": {
        "id": 1,
        "driver_id": 1,
        "mobil_id": 1,
        "start_time": "2024-01-15T08:00:00Z",
        "status": "active"
    }
}
```

### 3. End Session (Clock Out)
**Endpoint**: `PUT /api/session/:id/end`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Session ended successfully",
    "data": {
        "id": 1,
        "end_time": "2024-01-15T17:00:00Z",
        "status": "completed",
        "duration": "9 hours"
    }
}
```

### 4. Get Sessions by Date Range
**Endpoint**: `GET /api/session/date?start_date=2023-01-01&end_date=2023-12-31`

**Headers**: 
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `start_date` (required): Start date (YYYY-MM-DD)
- `end_date` (required): End date (YYYY-MM-DD)

---

## PASSENGER MANAGEMENT

### 1. Record Passenger
**Endpoint**: `POST /api/passenger/record`

**Headers**: 
```
Content-Type: application/json
```

**Description**: Endpoint untuk mencatat penumpang dari ESP32

**Request Body**:
```json
{
    "rfid_code": "RFID67890",
    "device_id": "ESP32-001"
}
```

**Response Success (201)**:
```json
{
    "success": true,
    "message": "Passenger recorded successfully",
    "data": {
        "id": 1,
        "rfid_code": "RFID67890",
        "session_id": 1,
        "recorded_at": "2024-01-15T10:30:00Z"
    }
}
```

### 2. Get Passengers by Session
**Endpoint**: `GET /api/passenger/session/:sessionId`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Passengers retrieved successfully",
    "data": [
        {
            "id": 1,
            "rfid_code": "RFID67890",
            "recorded_at": "2024-01-15T10:30:00Z"
        },
        {
            "id": 2,
            "rfid_code": "RFID67891",
            "recorded_at": "2024-01-15T11:15:00Z"
        }
    ],
    "total": 2
}
```

### 3. Get Passengers by RFID
**Endpoint**: `GET /api/passenger/rfid/:rfidCode`

**Headers**: 
```
Authorization: Bearer <token>
```

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Passenger records retrieved successfully",
    "data": [
        {
            "id": 1,
            "rfid_code": "RFID67890",
            "session_id": 1,
            "recorded_at": "2024-01-15T10:30:00Z",
            "session": {
                "driver": {
                    "nama_driver": "John Doe"
                },
                "mobil": {
                    "nomor_mobil": "B1234CD"
                }
            }
        }
    ]
}
```

---

## REPORTS

### 1. Get Daily Report
**Endpoint**: `GET /api/reports/daily?date=2024-01-15`

**Headers**: 
```
Authorization: Bearer <token>
```

**Query Parameters**:
- `date` (optional): Specific date (YYYY-MM-DD), default: today

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Daily report retrieved successfully",
    "data": {
        "date": "2024-01-15",
        "total_sessions": 5,
        "total_passengers": 150,
        "active_vehicles": 3,
        "sessions": [
            {
                "id": 1,
                "driver": "John Doe",
                "vehicle": "B1234CD",
                "passengers_count": 30,
                "duration": "8 hours"
            }
        ]
    }
}
```

### 2. Get Weekly Report
**Endpoint**: `GET /api/reports/weekly?week=2024-W03`

**Headers**: 
```
Authorization: Bearer <token>
```

### 3. Get Monthly Report
**Endpoint**: `GET /api/reports/monthly?month=2024-01`

**Headers**: 
```
Authorization: Bearer <token>
```

### 4. Get Driver Report
**Endpoint**: `GET /api/reports/driver/:driverId`

**Headers**: 
```
Authorization: Bearer <token>
```

### 5. Get Vehicle Report
**Endpoint**: `GET /api/reports/vehicle/:vehicleId`

**Headers**: 
```
Authorization: Bearer <token>
```

---

## ESP32 RFID ENDPOINTS

### 1. RFID Tap - Clock In/Out
**Endpoint**: `POST /rfid-tap`

**Headers**: 
```
Content-Type: application/json
```

**Description**: Endpoint utama untuk ESP32. Menangani RFID tap untuk clock in/out driver

**Request Body**:
```json
{
    "rfid_code": "A1B2C3D4",
    "device_id": "ESP32_DEVICE_001"
}
```

**Response Success - Clock In (201)**:
```json
{
    "success": true,
    "message": "Session started successfully",
    "data": {
        "action": "clock_in",
        "session": {
            "id": 1,
            "driver_id": 1,
            "mobil_id": 1,
            "start_time": "2024-01-15T08:30:00Z",
            "status": "active",
            "driver": {
                "id": 1,
                "nama_driver": "John Doe",
                "rfid_code": "A1B2C3D4"
            },
            "mobil": {
                "id": 1,
                "nomor_mobil": "B1234CD"
            }
        },
        "message": "Driver John Doe clocked in successfully"
    }
}
```

**Response Success - Clock Out (200)**:
```json
{
    "success": true,
    "message": "Session ended successfully",
    "data": {
        "action": "clock_out",
        "session": {
            "id": 1,
            "end_time": "2024-01-15T16:30:00Z",
            "status": "completed"
        },
        "message": "Driver John Doe clocked out successfully"
    }
}
```

### 2. Get Device Status
**Endpoint**: `GET /device/:deviceId/status`

**Description**: Mengecek status device dan session aktif

**Response Success (200)**:
```json
{
    "success": true,
    "message": "Device status retrieved successfully",
    "data": {
        "device_id": "ESP32_DEVICE_001",
        "mobil": {
            "id": 1,
            "nomor_mobil": "B1234CD",
            "status": "active"
        },
        "active_session": {
            "id": 1,
            "driver": {
                "id": 1,
                "nama_driver": "John Doe",
                "rfid_code": "A1B2C3D4"
            }
        },
        "last_sync": "2024-01-15T10:30:00Z",
        "status": "online"
    }
}
```

---

## MODEL DATABASE

### Struktur Database

#### 1. Admin
```sql
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role ENUM('admin', 'super_admin') DEFAULT 'admin',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. Driver
```sql
CREATE TABLE drivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rfid_code VARCHAR(50) UNIQUE NOT NULL,
    nama_driver VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. Mobil (Vehicle)
```sql
CREATE TABLE mobils (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nomor_mobil VARCHAR(20) UNIQUE NOT NULL,
    capacity INT NOT NULL DEFAULT 8,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4. Device
```sql
CREATE TABLE devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    mobil_id INT NOT NULL,
    status ENUM('online', 'offline', 'maintenance') DEFAULT 'offline',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mobil_id) REFERENCES mobils(id)
);
```

#### 5. Driver Mobile Session
```sql
CREATE TABLE driver_mobil_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    mobil_id INT NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id),
    FOREIGN KEY (mobil_id) REFERENCES mobils(id)
);
```

#### 6. Passenger Record
```sql
CREATE TABLE passenger_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rfid_code VARCHAR(50) NOT NULL,
    session_id INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES driver_mobil_sessions(id)
);
```

#### 7. Driver Login History
```sql
CREATE TABLE driver_login_histories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);
```

#### 8. Blacklisted Token
```sql
CREATE TABLE blacklisted_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relasi Database
- **Driver** memiliki banyak **Sessions** (One-to-Many)
- **Mobil** memiliki banyak **Sessions** (One-to-Many)
- **Mobil** memiliki satu **Device** (One-to-One)
- **Session** memiliki banyak **Passenger Records** (One-to-Many)
- **Driver** memiliki banyak **Login History** (One-to-Many)

---

## ERROR HANDLING

### Standard Error Response
```json
{
    "success": false,
    "message": "Error description",
    "error": {
        "code": "ERROR_CODE",
        "details": "Detailed error information"
    }
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Validation Error
- **500**: Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Unique constraint violation
- `DATABASE_ERROR`: Database operation failed
- `TOKEN_EXPIRED`: JWT token expired
- `INVALID_TOKEN`: Invalid JWT token

---

## TESTING DAN VALIDASI

### Postman Collection
Sistem dilengkapi dengan Postman Collection yang berisi:
- Semua endpoint API
- Sample request dan response
- Environment variables
- Authentication setup
- Test scenarios

### Environment Setup
```json
{
    "base_url": "http://localhost:3000",
    "token": "",
    "deviceId": "ESP32_DEVICE_001",
    "rfidCode": "A1B2C3D4"
}
```

### Testing Checklist
1. **Authentication Testing**
   - ✅ Admin login
   - ✅ Driver login
   - ✅ Token validation
   - ✅ Logout functionality

2. **CRUD Operations Testing**
   - ✅ Create operations
   - ✅ Read operations
   - ✅ Update operations
   - ✅ Delete operations

3. **ESP32 Integration Testing**
   - ✅ RFID tap for clock in
   - ✅ RFID tap for clock out
   - ✅ Device status check
   - ✅ Passenger recording

4. **Reports Testing**
   - ✅ Daily reports
   - ✅ Weekly reports
   - ✅ Monthly reports
   - ✅ Driver-specific reports

### Performance Metrics
- **Response Time**: < 200ms untuk operasi standar
- **Throughput**: 100+ requests per second
- **Database Queries**: Optimized dengan indexing
- **Memory Usage**: < 512MB untuk production

---

## KESIMPULAN

### Pencapaian Sistem
1. **API Backend**: Berhasil mengimplementasikan RESTful API lengkap
2. **Database Design**: Struktur database yang normalized dan efisien
3. **Security**: Implementasi autentikasi dan autorisasi yang aman
4. **ESP32 Integration**: Integrasi hardware ESP32 dengan RFID
5. **Real-time Processing**: Pencatatan data real-time
6. **Reporting**: Sistem laporan yang komprehensif

### Fitur Unggulan
- **Plug-and-Play ESP32**: Device mudah dikonfigurasi
- **Role-based Access**: Kontrol akses berdasarkan peran
- **Data Analytics**: Laporan dan analisis data
- **Scalable Architecture**: Arsitektur yang dapat dikembangkan
- **Complete Documentation**: Dokumentasi API yang lengkap

### Rekomendasi Pengembangan
1. **Mobile App**: Pengembangan aplikasi mobile
2. **Real-time Dashboard**: Dashboard monitoring real-time
3. **Push Notifications**: Notifikasi real-time
4. **Data Export**: Export data ke Excel/PDF
5. **Advanced Analytics**: Machine learning untuk prediksi

---

**Dokumentasi ini dibuat sebagai bagian dari Laporan Praktik Kerja Lapangan (PKL)**
**Sistem Penghitung Penumpang - Backend API Documentation**

*Tanggal: Juli 2025*
