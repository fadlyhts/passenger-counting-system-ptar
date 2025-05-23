const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PassengerRecord = sequelize.define('PassengerRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        rfid_code: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        driver_mobil_session_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'driver_mobil_session',
                key: 'id'
            }
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'passenger_record',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    PassengerRecord.associate = (models) => {
        PassengerRecord.belongsTo(models.DriverMobilSession, {
            foreignKey: 'driver_mobil_session_id',
            as: 'session'
        });
    };

    return PassengerRecord;
};
