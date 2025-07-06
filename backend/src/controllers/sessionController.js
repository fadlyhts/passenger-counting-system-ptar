const { DriverMobilSession, Driver, Mobil, PassengerRecord, Device } = require('../models');
const { formatResponse, formatError } = require('../utils');
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
          // Parse dates and make them inclusive
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json(formatError(null, 'Invalid date format', 400));
        }
        
        // Set start date to beginning of day (00:00:00)
        startDate.setHours(0, 0, 0, 0);
        
        // Set end date to end of day (23:59:59.999)
        endDate.setHours(23, 59, 59, 999);
        
        console.log('Session date range query:', {
            start_date_param: start_date,
            end_date_param: end_date,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        
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
 * Handle RFID tap from ESP32 device
 * Toggle session state: start if no active session, end if active session exists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleRfidTap = async (req, res) => {
    try {
        const { rfid_code, device_id } = req.body;
        
        // Validate required fields
        if (!rfid_code || !device_id) {
            return res.status(400).json(formatError(null, 'RFID code and device ID are required', 400));
        }
        
        // Find driver by RFID code
        const driver = await Driver.findOne({
            where: { 
                rfid_code: rfid_code.trim(),
                status: 'active'
            }
        });
        
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found or inactive', 404));
        }
        
        // Find device and associated mobil
        const device = await Device.findOne({
            where: { device_id: device_id.trim() },
            include: [{
                model: Mobil,
                as: 'mobil',
                attributes: ['id', 'nomor_mobil', 'status']
            }]
        });
        
        if (!device) {
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        if (!device.mobil || device.mobil.status !== 'active') {
            return res.status(400).json(formatError(null, 'Associated mobil not found or inactive', 400));
        }
        
        // Update device last sync
        await device.update({
            last_sync: new Date(),
            status: 'online'
        });
        
        // Check if driver has an active session
        const activeSession = await DriverMobilSession.findOne({
            where: {
                driver_id: driver.id,
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
        
        if (activeSession) {
            // End existing session (Clock Out)
            await activeSession.update({
                end_time: new Date(),
                status: 'completed'
            });
            
            // Get updated session data
            const updatedSession = await DriverMobilSession.findByPk(activeSession.id, {
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
            
            return res.json(formatResponse({
                action: 'clock_out',
                session: updatedSession
            }, 'Session ended successfully'));
            
        } else {
            // Check if mobil already has an active session with another driver
            const activeMobilSession = await DriverMobilSession.findOne({
                where: {
                    mobil_id: device.mobil.id,
                    status: 'active'
                }
            });
            
            if (activeMobilSession) {
                return res.status(400).json(formatError(null, 'Mobil already has an active session with another driver', 400));
            }
            
            // Start new session (Clock In)
            const newSession = await DriverMobilSession.create({
                driver_id: driver.id,
                mobil_id: device.mobil.id,
                start_time: new Date(),
                end_time: null,
                passenger_count: 0,
                status: 'active'
            });
            
            // Get created session with related data
            const createdSession = await DriverMobilSession.findByPk(newSession.id, {
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
            
            return res.status(201).json(formatResponse({
                action: 'clock_in',
                session: createdSession
            }, 'Session started successfully'));
        }
        
    } catch (error) {
        console.error('RFID Tap Error:', error);
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get device status for ESP32
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDeviceStatus = async (req, res) => {
    try {
        const { device_id } = req.params;
        
        const device = await Device.findOne({
            where: { device_id: device_id.trim() },
            include: [{
                model: Mobil,
                as: 'mobil',
                attributes: ['id', 'nomor_mobil', 'status'],
                include: [{
                    model: DriverMobilSession,
                    as: 'sessions',
                    where: { status: 'active' },
                    required: false,
                    include: [{
                        model: Driver,
                        as: 'driver',
                        attributes: ['id', 'nama_driver', 'rfid_code']
                    }]
                }]
            }]
        });
        
        if (!device) {
            return res.status(404).json(formatError(null, 'Device not found', 404));
        }
        
        // Update device status
        await device.update({
            last_sync: new Date(),
            status: 'online'
        });
        
        const activeSession = device.mobil && device.mobil.sessions && device.mobil.sessions.length > 0 
            ? device.mobil.sessions[0] 
            : null;
        
        return res.json(formatResponse({
            device_id: device.device_id,
            mobil: device.mobil,
            active_session: activeSession,
            last_sync: device.last_sync,
            status: device.status
        }, 'Device status retrieved successfully'));
        
    } catch (error) {
        console.error('Get Device Status Error:', error);
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    startSession,
    endSession,
    getActiveSessions,
    getSessionsByDateRange,
    getSessionById,
    getSessionsByDriverId,
    handleRfidTap,
    getDeviceStatus
};
