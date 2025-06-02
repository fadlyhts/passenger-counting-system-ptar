const { Sequelize } = require('sequelize');
const config = require('./index');

const sequelize = new Sequelize(
    config.db.database,
    config.db.user,
    config.db.password,
    {
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
        },
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Use this only for development
            }
        }
    }
);

module.exports = {
    sequelize,
    Sequelize
};
