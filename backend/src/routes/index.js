const express = require('express');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const driverRoutes = require('./driverRoutes');
const mobilRoutes = require('./mobilRoutes');
const deviceRoutes = require('./deviceRoutes');
const sessionRoutes = require('./sessionRoutes');
const passengerRoutes = require('./passengerRoutes');
const reportsRoutes = require('./reportsRoutes');

const router = express.Router();

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/driver', driverRoutes);
router.use('/api/mobil', mobilRoutes);
router.use('/api/device', deviceRoutes);
router.use('/api/session', sessionRoutes);
router.use('/api/passenger', passengerRoutes);
router.use('/api/reports', reportsRoutes);

// Base route
router.get('/', (req, res) => {
    res.json({
        message: 'Passenger Counting System API',
        version: '1.0.0'
    });
});

module.exports = router;
