const express = require('express');
const { body } = require('express-validator');
const { passengerController } = require('../controllers');
const { auth } = require('../middleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route POST /api/passenger/record
 * @desc Record a new passenger from ESP32
 * @access Public (for ESP32 devices)
 */
router.post(
    '/record',
    validate([
        body('rfid_code').notEmpty().withMessage('RFID code is required'),
        body('device_id').notEmpty().withMessage('Device ID is required')
    ]),
    passengerController.recordPassenger
);

// All other passenger routes require authentication
router.use(auth.verifyToken);

/**
 * @route GET /api/passenger/session/:id
 * @desc Get passengers by session ID
 * @access Private
 */
router.get('/session/:id', passengerController.getPassengersBySessionId);

/**
 * @route GET /api/passenger/:id
 * @desc Get passenger record by ID
 * @access Private
 */
router.get('/:id', passengerController.getPassengerById);

/**
 * @route GET /api/passenger/rfid/:rfid_code
 * @desc Get passenger records by RFID code
 * @access Private
 */
router.get('/rfid/:rfid_code', passengerController.getPassengersByRfid);

module.exports = router;
