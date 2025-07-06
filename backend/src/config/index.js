const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    port: process.env.PORT || 80,
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'passenger_recording_db',
        dialect: 'mysql'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
        expiration: process.env.JWT_EXPIRATION || '1h'
    },
    device: {
        apiKey: process.env.DEVICE_API_KEY || 'esp32-device-key-2024'
    },
    nodeEnv: process.env.NODE_ENV || 'development'
};
