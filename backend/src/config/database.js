const { Sequelize } = require('sequelize');
const config = require('./index');

// Determine if we're connecting to a cloud database or localhost
const isCloudDatabase = config.db.host !== 'localhost';

// Configure connection options
const connectionOptions = {
    host: config.db.host,
    dialect: config.db.dialect,
    logging: config.nodeEnv === 'development' ? console.log : false,
    define: {
        timestamps: true,
        underscored: true
    },
    timezone: '+07:00', // Jakarta timezone (UTC+7)
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

// Add SSL options only for cloud databases
if (isCloudDatabase) {
    connectionOptions.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false // Use this only for development
        }
    };
}

const sequelize = new Sequelize(
    config.db.database,
    config.db.user,
    config.db.password,
    connectionOptions
);

module.exports = {
    sequelize,
    Sequelize
};
