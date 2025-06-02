const { Device, Mobil } = require('../models');
const { formatResponse, formatError } = require('../utils');

/**
 * Get all devices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllDevices = async (req, res) => {
    try {
        const devices = await Device.findAll({
            include: [
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil', 'status']
                }
            ]
        });
        
        return res.json(formatResponse(devices));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get device by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDeviceById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const device = await Device.findByPk(id, {
            include: [
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil', 'status']
                }
            ]
        });
        
        if (!device) {
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        return res.json(formatResponse(device));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Create new device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createDevice = async (req, res) => {
    try {
        const { device_id, mobil_id, status } = req.body;
        
        // Check if device_id already exists
        const existingDevice = await Device.findOne({ where: { device_id } });
        if (existingDevice) {
            return res.status(400).json(formatError(null, 'Device ID already exists', 400));
        }
        
        // Check if mobil exists
        const mobil = await Mobil.findByPk(mobil_id);
        if (!mobil) {
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        // Create new device
        const device = await Device.create({
            device_id,
            mobil_id,
            status: status || 'offline',
            last_sync: null
        });
        
        // Get the created device with mobil information
        const createdDevice = await Device.findByPk(device.id, {
            include: [
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil', 'status']
                }
            ]
        });
        
        return res.status(201).json(formatResponse(createdDevice, 'Device created successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Update device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const { device_id, mobil_id, status } = req.body;
        
        // Find device
        const device = await Device.findByPk(id);
        if (!device) {
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        // Check if device_id already exists (if being updated)
        if (device_id && device_id !== device.device_id) {
            const existingDevice = await Device.findOne({ where: { device_id } });
            if (existingDevice) {
                return res.status(400).json(formatError(null, 'Device ID already exists', 400));
            }
        }
        
        // Check if mobil exists (if being updated)
        if (mobil_id && mobil_id !== device.mobil_id) {
            const mobil = await Mobil.findByPk(mobil_id);
            if (!mobil) {
                return res.status(404).json(formatError(null, 'Mobil not found', 404));
            }
        }
        
        // Update device
        const updateData = {};
        if (device_id) updateData.device_id = device_id;
        if (mobil_id) updateData.mobil_id = mobil_id;
        if (status) updateData.status = status;
        
        await device.update(updateData);
        
        // Get the updated device with mobil information
        const updatedDevice = await Device.findByPk(id, {
            include: [
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil', 'status']
                }
            ]
        });
        
        return res.json(formatResponse(updatedDevice, 'Device updated successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Delete device
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteDevice = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find device
        const device = await Device.findByPk(id);
        if (!device) {
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        // Delete device
        await device.destroy();
        
        return res.json(formatResponse(null, 'Device deleted successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Update device status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateDeviceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        // Find device
        const device = await Device.findByPk(id);
        if (!device) {
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        // Validate status
        if (!['online', 'offline'].includes(status)) {
            return res.status(400).json(formatError(null, 'Invalid status. Must be "online" or "offline"', 400));
        }
        
        // Update device status and last_sync
        await device.update({
            status,
            last_sync: new Date()
        });
        
        return res.json(formatResponse({
            id: device.id,
            device_id: device.device_id,
            status: device.status,
            last_sync: device.last_sync
        }, 'Device status updated successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    getAllDevices,
    getDeviceById,
    createDevice,
    updateDevice,
    deleteDevice,
    updateDeviceStatus
};
