const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    const Driver = sequelize.define('Driver', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        rfid_code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        nama_driver: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        last_login: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active'
        }
    }, {
        tableName: 'driver',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        hooks: {
            beforeCreate: async (driver) => {
                if (driver.password) {
                    driver.password = await bcrypt.hash(driver.password, 10);
                }
            },
            beforeUpdate: async (driver) => {
                if (driver.changed('password')) {
                    driver.password = await bcrypt.hash(driver.password, 10);
                }
            }
        }
    });

    Driver.prototype.validatePassword = async function(password) {
        return await bcrypt.compare(password, this.password);
    };

    Driver.associate = (models) => {
        Driver.hasMany(models.DriverMobilSession, {
            foreignKey: 'driver_id',
            as: 'sessions'
        });
        
        Driver.hasMany(models.DriverLoginHistory, {
            foreignKey: 'driver_id',
            as: 'loginHistory'
        });
    };

    return Driver;
};
