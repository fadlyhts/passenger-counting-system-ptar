const { PassengerRecord, DriverMobilSession, Driver, Mobil } = require('../models');
const { formatResponse, formatError } = require('../utils');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get daily passenger count report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDailyReport = async (req, res) => {
    try {
        const { date } = req.query;
        
        // Default to today if no date provided
        let reportDate;
        if (date) {
            // Use the exact date provided by the user
            reportDate = date;
        } else {
            // Get today's date in YYYY-MM-DD format
            reportDate = new Date().toISOString().split('T')[0];
        }
        
        // Get passenger records for the day with explicit date handling
        const passengerRecords = await PassengerRecord.findAll({
            where: sequelize.literal(`DATE(timestamp) = DATE('${reportDate}')`),
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
            order: [['timestamp', 'ASC']]
        });
        
        // Get active sessions for the day with explicit date handling
        const activeSessions = await DriverMobilSession.findAll({
            where: sequelize.literal(`
                DATE(start_time) = DATE('${reportDate}')
                OR DATE(end_time) = DATE('${reportDate}')
                OR (DATE(start_time) <= DATE('${reportDate}') AND DATE(end_time) >= DATE('${reportDate}'))
                OR (DATE(start_time) <= DATE('${reportDate}') AND end_time IS NULL)
            `),
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
            ],
            order: [['start_time', 'ASC']]
        });
        
        // Calculate total passengers
        const totalPassengers = passengerRecords.length;
        
        // Group by session
        const sessionCounts = {};
        passengerRecords.forEach(record => {
            const sessionId = record.driver_mobil_session_id;
            if (!sessionCounts[sessionId]) {
                sessionCounts[sessionId] = {
                    session_id: sessionId,
                    driver_name: record.session.driver.nama_driver,
                    mobil_number: record.session.mobil.nomor_mobil,
                    count: 0
                };
            }
            sessionCounts[sessionId].count++;
        });
        
        // Convert to array
        const sessionCountsArray = Object.values(sessionCounts);
        
        return res.json(formatResponse({
            date: reportDate,
            total_passengers: totalPassengers,
            active_sessions: activeSessions.length,
            sessions: sessionCountsArray,
            records: passengerRecords
        }));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get weekly passenger count report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getWeeklyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Default to current week if no dates provided
        let reportStartDate, reportEndDate;
        
        if (startDate && endDate) {
            // Use the exact dates provided by the user without any timezone manipulation
            reportStartDate = startDate;
            reportEndDate = endDate;
        } else {
            // Get current week (Sunday to Saturday)
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
            endOfWeek.setHours(23, 59, 59, 999);
            
            // Format dates as YYYY-MM-DD
            reportStartDate = startOfWeek.toISOString().split('T')[0];
            reportEndDate = endOfWeek.toISOString().split('T')[0];
        }
        
        // Get daily counts using SQL query for better performance with explicit date handling
        const dailyCounts = await sequelize.query(`
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as count
            FROM 
                passenger_record
            WHERE 
                DATE(timestamp) BETWEEN DATE(:startDate) AND DATE(:endDate)
            GROUP BY 
                DATE(timestamp)
            ORDER BY 
                date ASC
        `, {
            replacements: { 
                startDate: reportStartDate,
                endDate: reportEndDate
            },
            type: sequelize.QueryTypes.SELECT
        });
        
        // Get total passenger count
        const totalPassengers = dailyCounts.reduce((sum, day) => sum + parseInt(day.count), 0);
        
        // Get session data with explicit date handling
        const sessions = await DriverMobilSession.findAll({
            where: sequelize.literal(`
                (DATE(start_time) BETWEEN DATE('${reportStartDate}') AND DATE('${reportEndDate}'))
                OR (DATE(end_time) BETWEEN DATE('${reportStartDate}') AND DATE('${reportEndDate}'))
                OR (DATE(start_time) <= DATE('${reportStartDate}') AND DATE(end_time) >= DATE('${reportEndDate}'))
                OR (DATE(start_time) <= DATE('${reportEndDate}') AND end_time IS NULL)
            `),
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
            ],
            order: [['start_time', 'ASC']]
        });
        
        return res.json(formatResponse({
            start_date: reportStartDate,
            end_date: reportEndDate,
            total_passengers: totalPassengers,
            daily_counts: dailyCounts,
            sessions: sessions.map(session => ({
                id: session.id,
                driver_name: session.driver.nama_driver,
                mobil_number: session.mobil.nomor_mobil,
                start_time: session.start_time,
                end_time: session.end_time,
                passenger_count: session.passenger_count,
                status: session.status
            }))
        }));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get monthly passenger count report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;
        
        // Default to current year and month if not provided
        const currentDate = new Date();
        const reportYear = year || currentDate.getFullYear();
        const reportMonth = month || (currentDate.getMonth() + 1); // Use 1-indexed month for consistency
        
        // Create date strings for the first and last day of the month
        const startDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-01`;
        
        // Calculate the last day of the month using SQL
        const lastDayQuery = await sequelize.query(`
            SELECT LAST_DAY('${startDate}') as last_day
        `, {
            type: sequelize.QueryTypes.SELECT
        });
        
        const endDate = lastDayQuery[0].last_day;
        
        // Get daily counts using SQL query for better performance with explicit date handling
        const dailyCounts = await sequelize.query(`
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as count
            FROM 
                passenger_record
            WHERE 
                DATE(timestamp) BETWEEN DATE(:startDate) AND DATE(:endDate)
            GROUP BY 
                DATE(timestamp)
            ORDER BY 
                date ASC
        `, {
            replacements: { 
                startDate: startDate,
                endDate: endDate
            },
            type: sequelize.QueryTypes.SELECT
        });
        
        // Get total passenger count
        const totalPassengers = dailyCounts.reduce((sum, day) => sum + parseInt(day.count), 0);
        
        // Get driver statistics with explicit date handling
        const driverStats = await sequelize.query(`
            SELECT 
                d.id as driver_id,
                d.nama_driver,
                COUNT(DISTINCT dms.id) as session_count,
                SUM(dms.passenger_count) as total_passengers
            FROM 
                driver d
            JOIN 
                driver_mobil_session dms ON d.id = dms.driver_id
            WHERE 
                (DATE(dms.start_time) BETWEEN DATE(:startDate) AND DATE(:endDate))
                OR (DATE(dms.end_time) BETWEEN DATE(:startDate) AND DATE(:endDate))
                OR (DATE(dms.start_time) <= DATE(:startDate) AND (DATE(dms.end_time) >= DATE(:endDate) OR dms.end_time IS NULL))
            GROUP BY 
                d.id, d.nama_driver
            ORDER BY 
                total_passengers DESC
        `, {
            replacements: { 
                startDate: startDate,
                endDate: endDate
            },
            type: sequelize.QueryTypes.SELECT
        });
        
        // Get mobil statistics with explicit date handling
        const mobilStats = await sequelize.query(`
            SELECT 
                m.id as mobil_id,
                m.nomor_mobil,
                COUNT(DISTINCT dms.id) as session_count,
                SUM(dms.passenger_count) as total_passengers
            FROM 
                mobil m
            JOIN 
                driver_mobil_session dms ON m.id = dms.mobil_id
            WHERE 
                (DATE(dms.start_time) BETWEEN DATE(:startDate) AND DATE(:endDate))
                OR (DATE(dms.end_time) BETWEEN DATE(:startDate) AND DATE(:endDate))
                OR (DATE(dms.start_time) <= DATE(:startDate) AND (DATE(dms.end_time) >= DATE(:endDate) OR dms.end_time IS NULL))
            GROUP BY 
                m.id, m.nomor_mobil
            ORDER BY 
                total_passengers DESC
        `, {
            replacements: { 
                startDate: startDate,
                endDate: endDate
            },
            type: sequelize.QueryTypes.SELECT
        });
        
        return res.json(formatResponse({
            year: parseInt(reportYear),
            month: parseInt(reportMonth),
            start_date: startDate,
            end_date: endDate,
            total_passengers: totalPassengers,
            daily_counts: dailyCounts,
            driver_statistics: driverStats,
            mobil_statistics: mobilStats
        }));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get driver performance report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDriverReport = async (req, res) => {
    try {
        const { driver_id, startDate, endDate } = req.query;
        
        if (!driver_id) {
            return res.status(400).json(formatError(null, 'Driver ID is required', 400));
        }
        
        // Check if driver exists
        const driver = await Driver.findByPk(driver_id);
        if (!driver) {
            return res.status(404).json(formatError(null, 'Driver not found', 404));
        }
        
        // Default to last 30 days if no dates provided
        let reportStartDate, reportEndDate;
        
        if (startDate && endDate) {
            // Use the exact dates provided by the user without any timezone manipulation
            reportStartDate = startDate;
            reportEndDate = endDate;
        } else {
            // Get last 30 days
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            // Format dates as YYYY-MM-DD
            reportStartDate = thirtyDaysAgo.toISOString().split('T')[0];
            reportEndDate = today.toISOString().split('T')[0];
        }
        
        // Get sessions for the driver with explicit date handling
        const sessions = await DriverMobilSession.findAll({
            where: sequelize.literal(`
                driver_id = ${driver_id} AND (
                    (DATE(start_time) BETWEEN DATE('${reportStartDate}') AND DATE('${reportEndDate}'))
                    OR (DATE(end_time) BETWEEN DATE('${reportStartDate}') AND DATE('${reportEndDate}'))
                    OR (DATE(start_time) <= DATE('${reportStartDate}') AND DATE(end_time) >= DATE('${reportEndDate}'))
                    OR (DATE(start_time) <= DATE('${reportEndDate}') AND end_time IS NULL)
                )
            `),
            include: [
                {
                    model: Mobil,
                    as: 'mobil',
                    attributes: ['id', 'nomor_mobil']
                }
            ],
            order: [['start_time', 'ASC']]
        });
        
        // Calculate total passengers and hours worked
        let totalPassengers = 0;
        let totalHoursWorked = 0;
        
        const sessionDetails = sessions.map(session => {
            totalPassengers += session.passenger_count;
            
            // Calculate hours worked for completed sessions
            let hoursWorked = 0;
            if (session.end_time) {
                const sessionDuration = new Date(session.end_time) - new Date(session.start_time);
                hoursWorked = sessionDuration / (1000 * 60 * 60); // Convert ms to hours
                totalHoursWorked += hoursWorked;
            }
            
            return {
                id: session.id,
                mobil_number: session.mobil.nomor_mobil,
                start_time: session.start_time,
                end_time: session.end_time,
                passenger_count: session.passenger_count,
                status: session.status,
                hours_worked: session.end_time ? hoursWorked.toFixed(2) : null
            };
        });
        
        // Get daily passenger counts with explicit date handling
        const dailyCounts = await sequelize.query(`
            SELECT 
                DATE(pr.timestamp) as date,
                COUNT(*) as count
            FROM 
                passenger_record pr
            JOIN 
                driver_mobil_session dms ON pr.driver_mobil_session_id = dms.id
            WHERE 
                dms.driver_id = :driverId
                AND DATE(pr.timestamp) BETWEEN DATE(:startDate) AND DATE(:endDate)
            GROUP BY 
                DATE(pr.timestamp)
            ORDER BY 
                date ASC
        `, {
            replacements: { 
                driverId: driver_id,
                startDate: reportStartDate,
                endDate: reportEndDate
            },
            type: sequelize.QueryTypes.SELECT
        });
        
        return res.json(formatResponse({
            driver: {
                id: driver.id,
                name: driver.nama_driver,
                rfid_code: driver.rfid_code
            },
            start_date: reportStartDate,
            end_date: reportEndDate,
            total_passengers: totalPassengers,
            total_sessions: sessions.length,
            total_hours_worked: totalHoursWorked.toFixed(2),
            daily_counts: dailyCounts,
            sessions: sessionDetails
        }));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Get mobil usage report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMobilReport = async (req, res) => {
    try {
        const { mobil_id, startDate, endDate } = req.query;
        
        if (!mobil_id) {
            return res.status(400).json(formatError(null, 'Mobil ID is required', 400));
        }
        
        // Check if mobil exists
        const mobil = await Mobil.findByPk(mobil_id);
        if (!mobil) {
            return res.status(404).json(formatError(null, 'Mobil not found', 404));
        }
        
        // Default to last 30 days if no dates provided
        let reportStartDate, reportEndDate;
        
        if (startDate && endDate) {
            // Use the exact dates provided by the user without any timezone manipulation
            reportStartDate = startDate;
            reportEndDate = endDate;
        } else {
            // Get last 30 days
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            // Format dates as YYYY-MM-DD
            reportStartDate = thirtyDaysAgo.toISOString().split('T')[0];
            reportEndDate = today.toISOString().split('T')[0];
        }
        
        // Get sessions for the mobil with explicit date handling
        const sessions = await DriverMobilSession.findAll({
            where: sequelize.literal(`
                mobil_id = ${mobil_id} AND (
                    (DATE(start_time) BETWEEN DATE('${reportStartDate}') AND DATE('${reportEndDate}'))
                    OR (DATE(end_time) BETWEEN DATE('${reportStartDate}') AND DATE('${reportEndDate}'))
                    OR (DATE(start_time) <= DATE('${reportStartDate}') AND DATE(end_time) >= DATE('${reportEndDate}'))
                    OR (DATE(start_time) <= DATE('${reportEndDate}') AND end_time IS NULL)
                )
            `),
            include: [
                {
                    model: Driver,
                    as: 'driver',
                    attributes: ['id', 'nama_driver']
                }
            ],
            order: [['start_time', 'ASC']]
        });
        
        // Calculate total passengers and hours in use
        let totalPassengers = 0;
        let totalHoursInUse = 0;
        
        const sessionDetails = sessions.map(session => {
            totalPassengers += session.passenger_count;
            
            // Calculate hours in use for completed sessions
            let hoursInUse = 0;
            if (session.end_time) {
                const sessionDuration = new Date(session.end_time) - new Date(session.start_time);
                hoursInUse = sessionDuration / (1000 * 60 * 60); // Convert ms to hours
                totalHoursInUse += hoursInUse;
            }
            
            return {
                id: session.id,
                driver_name: session.driver.nama_driver,
                start_time: session.start_time,
                end_time: session.end_time,
                passenger_count: session.passenger_count,
                status: session.status,
                hours_in_use: session.end_time ? hoursInUse.toFixed(2) : null
            };
        });
        
        // Get daily passenger counts with explicit date handling
        const dailyCounts = await sequelize.query(`
            SELECT 
                DATE(pr.timestamp) as date,
                COUNT(*) as count
            FROM 
                passenger_record pr
            JOIN 
                driver_mobil_session dms ON pr.driver_mobil_session_id = dms.id
            WHERE 
                dms.mobil_id = :mobilId
                AND DATE(pr.timestamp) BETWEEN DATE(:startDate) AND DATE(:endDate)
            GROUP BY 
                DATE(pr.timestamp)
            ORDER BY 
                date ASC
        `, {
            replacements: { 
                mobilId: mobil_id,
                startDate: reportStartDate,
                endDate: reportEndDate
            },
            type: sequelize.QueryTypes.SELECT
        });
        
        // Get driver statistics for this mobil with explicit date handling
        const driverStats = await sequelize.query(`
            SELECT 
                d.id as driver_id,
                d.nama_driver,
                COUNT(DISTINCT dms.id) as session_count,
                SUM(dms.passenger_count) as total_passengers
            FROM 
                driver d
            JOIN 
                driver_mobil_session dms ON d.id = dms.driver_id
            WHERE 
                dms.mobil_id = :mobilId
                AND (
                    (DATE(dms.start_time) BETWEEN DATE(:startDate) AND DATE(:endDate))
                    OR (DATE(dms.end_time) BETWEEN DATE(:startDate) AND DATE(:endDate))
                    OR (DATE(dms.start_time) <= DATE(:startDate) AND (DATE(dms.end_time) >= DATE(:endDate) OR dms.end_time IS NULL))
                )
            GROUP BY 
                d.id, d.nama_driver
            ORDER BY 
                total_passengers DESC
        `, {
            replacements: { 
                mobilId: mobil_id,
                startDate: reportStartDate,
                endDate: reportEndDate
            },
            type: sequelize.QueryTypes.SELECT
        });
        
        return res.json(formatResponse({
            mobil: {
                id: mobil.id,
                nomor_mobil: mobil.nomor_mobil,
                status: mobil.status
            },
            start_date: reportStartDate,
            end_date: reportEndDate,
            total_passengers: totalPassengers,
            total_sessions: sessions.length,
            total_hours_in_use: totalHoursInUse.toFixed(2),
            daily_counts: dailyCounts,
            driver_statistics: driverStats,
            sessions: sessionDetails
        }));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    getDailyReport,
    getWeeklyReport,
    getMonthlyReport,
    getDriverReport,
    getMobilReport
};
