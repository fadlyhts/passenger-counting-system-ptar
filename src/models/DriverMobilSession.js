const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DriverMobilSession = sequelize.define('DriverMobilSession', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        driver_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'driver',
                key: 'id'
            }
        },
        mobil_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'mobil',
                key: 'id'
            }
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        passenger_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('active', 'completed'),
            defaultValue: 'active'
        }
    }, {
        tableName: 'driver_mobil_session',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    DriverMobilSession.associate = (models) => {
        DriverMobilSession.belongsTo(models.Driver, {
            foreignKey: 'driver_id',
            as: 'driver'
        });
        
        DriverMobilSession.belongsTo(models.Mobil, {
            foreignKey: 'mobil_id',
            as: 'mobil'
        });
        
        DriverMobilSession.hasMany(models.PassengerRecord, {
            foreignKey: 'driver_mobil_session_id',
            as: 'passengerRecords'
        });
    };

    return DriverMobilSession;
};
