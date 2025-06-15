const express = require('express');
const { body } = require('express-validator');
const { driverController } = require('../controllers');
const { auth } = require('../middleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All driver routes require authentication
router.use(auth.verifyToken);

/**
 * @route PUT /api/driver/password
 * @desc Update driver's own password
 * @access Private (Driver only)
 */
router.put(
    '/password',
    auth.isDriver,
    validate([
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword').notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    ]),
    driverController.updateDriverPassword
);

/**
 * @route GET /api/driver
 * @desc Get all drivers
 * @access Private (Admin only)
 */
router.get('/', auth.isAdmin, driverController.getAllDrivers);

/**
 * @route GET /api/driver/:id
 * @desc Get driver by ID
 * @access Private (Admin or self)
 */
router.get('/:id', driverController.getDriverById);

/**
 * @route POST /api/driver
 * @desc Create a new driver
 * @access Private (Admin only)
 */
router.post(
    '/',
    auth.isAdmin,
    validate([
        body('rfid_code').notEmpty().withMessage('RFID code is required'),
        body('nama_driver').notEmpty().withMessage('Driver name is required'),
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('email').optional().isEmail().withMessage('Invalid email format')
    ]),
    driverController.createDriver
);

/**
 * @route PUT /api/driver/:id
 * @desc Update a driver
 * @access Private (Admin only)
 */
router.put(
    '/:id',
    auth.isAdmin,
    validate([
        body('rfid_code').optional(),
        body('nama_driver').optional(),
        body('email').optional().isEmail().withMessage('Invalid email format'),
        body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ]),
    driverController.updateDriver
);

/**
 * @route DELETE /api/driver/:id
 * @desc Delete a driver
 * @access Private (Admin only)
 */
router.delete('/:id', auth.isAdmin, driverController.deleteDriver);

/**
 * @route GET /api/driver/:id/login-history
 * @desc Get driver login history
 * @access Private (Admin or self)
 */
router.get('/:id/login-history', driverController.getDriverLoginHistory);

module.exports = router;
