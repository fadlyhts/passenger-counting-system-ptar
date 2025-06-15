const { Driver, DriverLoginHistory } = require('../models');
const { formatResponse, formatError } = require('../utils');

/**
 * Get all drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllDrivers = async (req, res) => {
    try {
        const drivers = await Driver.findAll({
            attributes: { exclude: ['password'] }
        });
        
        return res.json(formatResponse(drivers));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get driver by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDriverById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const driver = await Driver.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        return res.json(formatResponse(driver));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Create new driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createDriver = async (req, res) => {
    try {
        const { rfid_code, nama_driver, username, password, email } = req.body;
        
        // Check if username already exists
        const existingUsername = await Driver.findOne({ where: { username } });
        if (existingUsername) {
            return res.status(400).json(formatError(null, 'Username already exists', 400));
        }
        
        // Check if RFID code already exists
        const existingRfid = await Driver.findOne({ where: { rfid_code } });
        if (existingRfid) {
            return res.status(400).json(formatError(null, 'RFID code already exists', 400));
        }
        
        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await Driver.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json(formatError(null, 'Email already exists', 400));
            }
        }
        
        // Create new driver
        const driver = await Driver.create({
            rfid_code,
            nama_driver,
            username,
            password,
            email,
            status: 'active'
        });
        
        return res.status(201).json(formatResponse({
            id: driver.id,
            rfid_code: driver.rfid_code,
            nama_driver: driver.nama_driver,
            username: driver.username,
            email: driver.email,
            status: driver.status
        }, 'Driver created successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Update driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const { rfid_code, nama_driver, email, status, password } = req.body;
        
        // Find driver
        const driver = await Driver.findByPk(id);
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        // Check if RFID code already exists (if being updated)
        if (rfid_code && rfid_code !== driver.rfid_code) {
            const existingRfid = await Driver.findOne({ where: { rfid_code } });
            if (existingRfid) {
                return res.status(400).json(formatError(null, 'RFID code already exists', 400));
            }
        }
        
        // Check if email already exists (if being updated)
        if (email && email !== driver.email) {
            const existingEmail = await Driver.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json(formatError(null, 'Email already exists', 400));
            }
        }
        
        // Update driver
        const updateData = {};
        if (rfid_code) updateData.rfid_code = rfid_code;
        if (nama_driver) updateData.nama_driver = nama_driver;
        if (email) updateData.email = email;
        if (status) updateData.status = status;
        if (password) updateData.password = password;
        
        await driver.update(updateData);
        
        return res.json(formatResponse({
            id: driver.id,
            rfid_code: driver.rfid_code,
            nama_driver: driver.nama_driver,
            username: driver.username,
            email: driver.email,
            status: driver.status
        }, 'Driver updated successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Delete driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find driver
        const driver = await Driver.findByPk(id);
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        // Delete driver
        await driver.destroy();
        
        return res.json(formatResponse(null, 'Driver deleted successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get driver login history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDriverLoginHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find driver
        const driver = await Driver.findByPk(id);
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        // Get login history
        const loginHistory = await DriverLoginHistory.findAll({
            where: { driver_id: id },
            order: [['login_time', 'DESC']]
        });
        
        return res.json(formatResponse(loginHistory));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Update driver's own password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDriverPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const driverId = req.user.id; // Get driver ID from authenticated user
        
        // Find driver
        const driver = await Driver.findByPk(driverId);
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        // Verify current password
        const isPasswordValid = await driver.validatePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json(formatError(null, 'Current password is incorrect', 401));
        }
        
        // Update password
        await driver.update({ password: newPassword });
        
        return res.json(formatResponse(null, 'Password updated successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    getAllDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver,
    getDriverLoginHistory,
    updateDriverPassword
};
