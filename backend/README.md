# Passenger Counting System API

A backend API for a passenger counting system using Express.js, Sequelize ORM, and MySQL. This system allows tracking of passengers in vehicles using RFID technology.

## Features

- **Authentication**: JWT-based authentication for admins and drivers
- **Driver Management**: CRUD operations for drivers
- **Vehicle Management**: CRUD operations for vehicles (mobil)
- **Device Management**: CRUD operations for ESP32 devices
- **Session Management**: Driver clock-in/clock-out functionality
- **Passenger Recording**: Record passengers via RFID from ESP32 devices
- **Reporting**: View passenger counts and session history

## Tech Stack

- **Node.js & Express.js**: Backend framework
- **Sequelize ORM**: Database ORM
- **MySQL**: Database
- **JWT**: Authentication
- **Express Validator**: Input validation
- **Bcrypt**: Password hashing

## Database Schema

The system uses the following database tables:

- **admin**: Admin user management
- **driver**: Driver management
- **mobil**: Vehicle management
- **device**: ESP32 device management
- **driver_mobil_session**: Driver work sessions
- **passenger_record**: Passenger RFID records
- **driver_login_history**: Driver login tracking
- **blacklisted_tokens**: JWT token blacklist

## API Endpoints

### Authentication

- `POST /api/auth/admin/login`: Admin login
- `POST /api/auth/driver/login`: Driver login
- `POST /api/auth/logout`: Logout (blacklist token)

### Admin Management

- `GET /api/admin`: Get all admins
- `GET /api/admin/:id`: Get admin by ID
- `POST /api/admin`: Create a new admin
- `PUT /api/admin/:id`: Update an admin
- `DELETE /api/admin/:id`: Delete an admin

### Driver Management

- `GET /api/driver`: Get all drivers
- `GET /api/driver/:id`: Get driver by ID
- `POST /api/driver`: Create a new driver
- `PUT /api/driver/:id`: Update a driver
- `DELETE /api/driver/:id`: Delete a driver
- `GET /api/driver/:id/login-history`: Get driver login history

### Vehicle Management

- `GET /api/mobil`: Get all vehicles
- `GET /api/mobil/:id`: Get vehicle by ID
- `POST /api/mobil`: Create a new vehicle
- `PUT /api/mobil/:id`: Update a vehicle
- `DELETE /api/mobil/:id`: Delete a vehicle
- `GET /api/mobil/:id/sessions`: Get vehicle session history

### Device Management

- `GET /api/device`: Get all devices
- `GET /api/device/:id`: Get device by ID
- `POST /api/device`: Create a new device
- `PUT /api/device/:id`: Update a device
- `DELETE /api/device/:id`: Delete a device
- `PUT /api/device/:id/status`: Update device status

### Session Management

- `GET /api/session/active`: Get all active sessions
- `GET /api/session/date`: Get sessions by date range
- `GET /api/session/:id`: Get session by ID
- `POST /api/session/start`: Start a new driver session (clock in)
- `PUT /api/session/:id/end`: End a driver session (clock out)
- `GET /api/session/driver/:id`: Get sessions by driver ID

### Passenger Management

- `POST /api/passenger/record`: Record a new passenger from ESP32
- `GET /api/passenger/session/:id`: Get passengers by session ID
- `GET /api/passenger/:id`: Get passenger record by ID
- `GET /api/passenger/rfid/:rfid_code`: Get passenger records by RFID code

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables in `.env` file
4. Create MySQL database
5. Run the application: `npm start` or `npm run dev` for development

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=passenger_counting_system
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h
```

## License

ISC
