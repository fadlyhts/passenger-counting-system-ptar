const { PassengerRecord, Device, DriverMobilSession, Mobil, Driver } = require('../models');
const { formatResponse, formatError } = require('../utils');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Record a new passenger from ESP32
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const recordPassenger = async (req, res) => {
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
        
        // Check if the same RFID has been recorded in the last 5 minutes
        const fiveMinutesAgo = new Date(new Date() - 5 * 60 * 1000);
        const recentRecord = await PassengerRecord.findOne({
            where: {
                rfid_code,
                timestamp: {
                    [Op.gte]: fiveMinutesAgo
                }
            },
            transaction
        });
        
        if (recentRecord) {
            await transaction.rollback();
            return res.status(400).json(formatError(null, 'This RFID has already been recorded in the last 5 minutes', 400));
        }
        
        // Find active session for the device's mobil
        const activeSession = await DriverMobilSession.findOne({
            where: {
                mobil_id: device.mobil_id,
                status: 'active'
            },
            transaction
        });
        
        if (!activeSession) {
            await transaction.rollback();
            return res.status(400).json(formatError(null, 'No active session found for this device', 400));
        }
        
        // Get mobil
        const mobil = await Mobil.findByPk(device.mobil_id, { transaction });
        
        // No need to check capacity as it was removed from the model
        
        // Create passenger record
        const passengerRecord = await PassengerRecord.create({
            rfid_code,
            driver_mobil_session_id: activeSession.id,
            timestamp: new Date()
        }, { transaction });
        
        // Increment passenger count in session
        await activeSession.update({
            passenger_count: activeSession.passenger_count + 1
        }, { transaction });
        
        // Commit transaction
        await transaction.commit();
        
        return res.status(201).json(formatResponse({
            id: passengerRecord.id,
            rfid_code: passengerRecord.rfid_code,
            timestamp: passengerRecord.timestamp,
            session_id: activeSession.id,
            mobil_id: device.mobil_id,
            passenger_count: activeSession.passenger_count
        }, 'Passenger recorded successfully'));
    } catch (error) {
        // Rollback transaction on error
        await transaction.rollback();
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get passengers by session ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPassengersBySessionId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if session exists
        const session = await DriverMobilSession.findByPk(id);
        if (!session) {
            return res.status(404).json(formatError(null, 'Session not found', 404));
        }
        
        // Get passengers
        const passengers = await PassengerRecord.findAll({
            where: {
                driver_mobil_session_id: id
            },
            order: [['timestamp', 'DESC']]
        });
        
        return res.json(formatResponse({
            session_id: id,
            passenger_count: session.passenger_count,
            passengers
        }));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get passenger record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPassengerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find passenger record
        const passenger = await PassengerRecord.findByPk(id, {
            include: [
                {
                    model: DriverMobilSession,
                    as: 'session',
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
                }
            ]
        });
        
        if (!passenger) {
            return res.status(404).json(formatError(null, 'Passenger record not found', 404));
        }
        
        return res.json(formatResponse(passenger));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get passenger records by RFID code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getPassengersByRfid = async (req, res) => {
    try {
        const { rfid_code } = req.params;
        
        // Get passenger records
        const passengers = await PassengerRecord.findAll({
            where: {
                rfid_code
            },
            include: [
                {
                    model: DriverMobilSession,
                    as: 'session',
                    include: [
                        {
                            model: Driver,
                            as: 'driver',
                            attributes: ['id', 'nama_driver']
                        },
                        {
                            model: Mobil,
                            as: 'mobil',
                            attributes: ['id', 'nomor_mobil']
                        }
                    ]
                }
            ],
            order: [['timestamp', 'DESC']]
        });
        
        return res.json(formatResponse({
            rfid_code,
            count: passengers.length,
            records: passengers
        }));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    recordPassenger,
    getPassengersBySessionId,
    getPassengerById,
    getPassengersByRfid
};
