const { DriverMobilSession, Driver, Mobil, PassengerRecord, Device } = require('../models');
const { formatResponse, formatError } = require('../utils');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Start a new driver session (clock in)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const startSession = async (req, res) => {
    try {
        const { driver_id, mobil_id } = req.body;
        
        // Check if driver exists
        const driver = await Driver.findByPk(driver_id);
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        // Check if driver is active
        if (driver.status !== 'active') {
            return res.status(400).json(formatError(null, 'Driver is not active', 400));
        }
        
        // Check if mobil exists
        const mobil = await Mobil.findByPk(mobil_id);
        if (!mobil) {
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        // Check if mobil is active
        if (mobil.status !== 'active') {
            return res.status(400).json(formatError(null, 'Mobil is not active', 400));
        }
        
        // Check if driver already has an active session
        const activeDriverSession = await DriverMobilSession.findOne({
            where: {
                driver_id,
                status: 'active'
            }
        });
        
        if (activeDriverSession) {
            return res.status(400).json(formatError(null, 'Driver already has an active session', 400));
        }
        
        // Check if mobil already has an active session
        const activeMobilSession = await DriverMobilSession.findOne({
            where: {
                mobil_id,
                status: 'active'
            }
        });
        
        if (activeMobilSession) {
            return res.status(400).json(formatError(null, 'Mobil already has an active session', 400));
        }
        
        // Create new session
        const session = await DriverMobilSession.create({
            driver_id,
            mobil_id,
            start_time: new Date(),
            end_time: null,
            passenger_count: 0,
            status: 'active'
        });
        
        // Get the created session with driver and mobil information
        const createdSession = await DriverMobilSession.findByPk(session.id, {
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver', 'rfid_code']
                },
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                }
            ]
        });
        
        return res.status(201).json(formatResponse(createdSession, 'Session started successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * End a driver session (clock out)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const endSession = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find session
        const session = await DriverMobilSession.findByPk(id);
        if (!session) {
            return res.status(404).json(formatError(null, 'Session not found', 404));
        }
        
        // Check if session is active
        if (session.status !== 'active') {
            return res.status(400).json(formatError(null, 'Session is not active', 400));
        }
        
        // Update session
        await session.update({
            end_time: new Date(),
            status: 'completed'
        });
        
        // Get the updated session with driver and mobil information
        const updatedSession = await DriverMobilSession.findByPk(id, {
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver', 'rfid_code']
                },
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                }
            ]
        });
        
        return res.json(formatResponse(updatedSession, 'Session ended successfully'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get all active sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getActiveSessions = async (req, res) => {
    try {
        const sessions = await DriverMobilSession.findAll({
            where: {
                status: 'active'
            },
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver', 'rfid_code']
                },
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                }
            ]
        });
        
        return res.json(formatResponse(sessions));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get sessions by driver ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSessionsByDriverId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if driver exists
        const driver = await Driver.findByPk(id);
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        // Get sessions
        const sessions = await DriverMobilSession.findAll({
            where: {
                driver_id: id
            },
            include: [
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                }
            ],
            order: [['start_time', 'DESC']]
        });
        
        return res.json(formatResponse(sessions));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get session details by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find session with related data
        const session = await DriverMobilSession.findByPk(id, {
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver', 'rfid_code']
                },
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                },
                {
                    model: PassengerRecord,
                    as: 'passengerRecords'
                }
            ]
        });
        
        if (!session) {
            return res.status(404).json(formatError(null, 'Session not found', 404));
        }
        
        return res.json(formatResponse(session));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get sessions by date range
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSessionsByDateRange = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json(formatError(null, 'Start date and end date are required', 400));
        }
        
        // Parse dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json(formatError(null, 'Invalid date format', 400));
        }
        
        // Get sessions
        const sessions = await DriverMobilSession.findAll({
            where: {
                start_time: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver', 'rfid_code']
                },
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                }
            ],
            order: [['start_time', 'DESC']]
        });
        
        return res.json(formatResponse(sessions));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Handle driver session via RFID tap (for ESP32 devices)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleRfidSession = async (req, res) => {
    // Use a transaction to ensure data consistency
    const transaction = await sequelize.transaction();
    
    try {
        const { rfid_code, device_id } = req.body;
        
        // Find device
        const device = await Device.findOne({
            where: { device_id },
            transaction
        });
        
        if (!device) {
            await transaction.rollback();
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        // Check if device is online
        if (device.status !== 'online') {
            await transaction.rollback();
            return res.status(400).json(formatError(null, 'Device is offline', 400));
        }
        
        // Update device last_sync
        await device.update({
            last_sync: new Date()
        }, { transaction });
        
        // Find driver by RFID code
        const driver = await Driver.findOne({
            where: { 
                rfid_code,
                status: 'active'
            },
            transaction
        });
        
        if (!driver) {
            await transaction.rollback();
            return res.status(404).json(formatError(null, 'Driver not found or inactive', 404));
        }
        
        // Get mobil information
        const mobil = await Mobil.findByPk(device.mobil_id, { transaction });
        if (!mobil) {
            await transaction.rollback();
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        // Check if mobil is active
        if (mobil.status !== 'active') {
            await transaction.rollback();
            return res.status(400).json(formatError(null, 'Mobil is not active', 400));
        }
        
        // Check for existing active session for this driver
        const existingDriverSession = await DriverMobilSession.findOne({
            where: {
                driver_id: driver.id,
                status: 'active'
            },
            transaction
        });
        
        // Check for existing active session for this mobil
        const existingMobilSession = await DriverMobilSession.findOne({
            where: {
                mobil_id: device.mobil_id,
                status: 'active'
            },
            transaction
        });
        
        let session;
        let action;
        
        if (existingDriverSession) {
            // Driver has an active session - end it
            await existingDriverSession.update({
                end_time: new Date(),
                status: 'completed'
            }, { transaction });
            
            session = existingDriverSession;
            action = 'ended';
        } else if (existingMobilSession) {
            // Another driver has active session on this mobil
            await transaction.rollback();
            return res.status(400).json(formatError(null, 'Another driver has an active session on this vehicle', 400));
        } else {
            // No active session - start new one
            session = await DriverMobilSession.create({
                driver_id: driver.id,
                mobil_id: device.mobil_id,
                start_time: new Date(),
                end_time: null,
                passenger_count: 0,
                status: 'active'
            }, { transaction });
            
            action = 'started';
        }
        
        // Get the session with driver and mobil information
        const sessionWithDetails = await DriverMobilSession.findByPk(session.id, {
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver', 'rfid_code']
                },
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                }
            ],
            transaction
        });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(200).json(formatResponse({
            session: sessionWithDetails,
            action,
            device_id: device.device_id,
            message: `Session ${action} successfully`
        }));
        
    } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    startSession,
    endSession,
    getActiveSessions,
    getSessionsByDriverId,
    getSessionById,
    getSessionsByDateRange,
    handleRfidSession
};
