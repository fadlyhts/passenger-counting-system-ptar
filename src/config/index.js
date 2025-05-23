const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    port: process.env.PORT || 3000,
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
    nodeEnv: process.env.NODE_ENV || 'development'
};
