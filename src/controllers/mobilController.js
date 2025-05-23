const { Mobil, Device, DriverMobilSession } = require('../models');
const { formatResponse, formatError } = require('../utils');

/**
 * Get all mobil (cars)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllMobil = async (req, res) => {
    try {
        const mobils = await Mobil.findAll();
        
        return res.json(formatResponse(mobils));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get mobil by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMobilById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const mobil = await Mobil.findByPk(id, {
            include: [
                {
                    model: Device,
                    as: 'devices'
                }
            ]
        });
        
        if (!mobil) {
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        return res.json(formatResponse(mobil));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Create new mobil
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createMobil = async (req, res) => {
    try {
        const { nomor_mobil, status } = req.body;
        
        // Check if nomor_mobil already exists
        const existingMobil = await Mobil.findOne({ where: { nomor_mobil } });
        if (existingMobil) {
            return res.status(400).json(formatError(null, 'Nomor mobil already exists', 400));
        }
        
        // Create new mobil
        const mobil = await Mobil.create({
            nomor_mobil,
            status: status || 'active'
        });
        
        return res.status(201).json(formatResponse(mobil, 'Mobil created successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Update mobil
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMobil = async (req, res) => {
    try {
        const { id } = req.params;
        const { nomor_mobil, status } = req.body;
        
        // Find mobil
        const mobil = await Mobil.findByPk(id);
        if (!mobil) {
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        // Check if nomor_mobil already exists (if being updated)
        if (nomor_mobil && nomor_mobil !== mobil.nomor_mobil) {
            const existingMobil = await Mobil.findOne({ where: { nomor_mobil } });
            if (existingMobil) {
                return res.status(400).json(formatError(null, 'Nomor mobil already exists', 400));
            }
        }
        
        // Update mobil
        const updateData = {};
        if (nomor_mobil) updateData.nomor_mobil = nomor_mobil;
        if (status) updateData.status = status;
        
        await mobil.update(updateData);
        
        return res.json(formatResponse(mobil, 'Mobil updated successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Delete mobil
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMobil = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find mobil
        const mobil = await Mobil.findByPk(id);
        if (!mobil) {
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        // Check if mobil has active sessions
        const activeSessions = await DriverMobilSession.findOne({
            where: {
                mobil_id: id,
                status: 'active'
            }
        });
        
        if (activeSessions) {
            return res.status(400).json(formatError(null, 'Cannot delete mobil with active sessions', 400));
        }
        
        // Check if mobil has devices
        const devices = await Device.findAll({
            where: {
                mobil_id: id
            }
        });
        
        if (devices.length > 0) {
            return res.status(400).json(formatError(null, 'Cannot delete mobil with associated devices. Please remove devices first.', 400));
        }
        
        // Delete mobil
        await mobil.destroy();
        
        return res.json(formatResponse(null, 'Mobil deleted successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get mobil session history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMobilSessionHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find mobil
        const mobil = await Mobil.findByPk(id);
        if (!mobil) {
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        // Get session history
        const sessions = await DriverMobilSession.findAll({
            where: { mobil_id: id },
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver', 'rfid_code']
                }
            ],
            order: [['start_time', 'DESC']]
        });
        
        return res.json(formatResponse(sessions));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    getAllMobil,
    getMobilById,
    createMobil,
    updateMobil,
    deleteMobil,
    getMobilSessionHistory
};
