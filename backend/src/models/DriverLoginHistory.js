const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DriverLoginHistory = sequelize.define('DriverLoginHistory', {
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
        login_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        logout_time: {
            type: DataTypes.DATE,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING,
            allowNull: true
        },
        device_info: {
            type: DataTypes.STRING,
            allowNull: true
        },
        login_status: {
            type: DataTypes.ENUM('success', 'failed'),
            defaultValue: 'success'
        }
    }, {
        tableName: 'driver_login_history',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    DriverLoginHistory.associate = (models) => {
        DriverLoginHistory.belongsTo(models.Driver, {
            foreignKey: 'driver_id',
            as: 'driver'
        });
    };

    return DriverLoginHistory;
};
