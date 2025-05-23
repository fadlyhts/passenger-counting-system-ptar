const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BlacklistedToken = sequelize.define('BlacklistedToken', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        blacklisted_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'blacklisted_tokens',
        timestamps: false
    });

    return BlacklistedToken;
};
