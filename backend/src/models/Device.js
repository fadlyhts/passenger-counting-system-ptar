const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Device = sequelize.define('Device', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        device_id: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
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
        status: {
            type: DataTypes.ENUM('online', 'offline'),
            defaultValue: 'offline'
        },
        last_sync: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'device',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    Device.associate = (models) => {
        Device.belongsTo(models.Mobil, {
            foreignKey: 'mobil_id',
            as: 'mobil'
        });
    };

    return Device;
};
