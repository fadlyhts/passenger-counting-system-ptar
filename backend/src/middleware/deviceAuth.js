const { Device } = require('../models');
const { formatError } = require('../utils');

/**
 * Middleware to authenticate ESP32 devices
 * This middleware checks if the device exists (no API key required)
 */
const authenticateDevice = async (req, res, next) => {
    try {
        const deviceId = req.body.device_id || req.params.device_id;
        
        if (!deviceId) {
            return res.status(400).json(formatError(null, 'Device ID is required', 400));
        }
        
        // Find device in database
        const device = await Device.findOne({
            where: { device_id: deviceId.trim() }
        });
        
        if (!device) {
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        // Add device info to request object
        req.device = device;
        next();
        
    } catch (error) {
        console.error('Device Authentication Error:', error);
        return res.status(500).json(formatError(error));
    }
};

/**
 * Middleware to validate device is online and functional
 */
const validateDeviceStatus = async (req, res, next) => {
    try {
        if (!req.device) {
            return res.status(400).json(formatError(null, 'Device authentication required', 400));
        }
        
        // Update device last sync time
        await req.device.update({
            last_sync: new Date(),
            status: 'online'
        });
        
        next();
        
    } catch (error) {
        console.error('Device Status Validation Error:', error);
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    authenticateDevice,
    validateDeviceStatus
};
