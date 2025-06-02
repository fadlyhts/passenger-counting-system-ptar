const express = require('express');
const { body } = require('express-validator');
const { deviceController } = require('../controllers');
const { auth } = require('../middleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All device routes require authentication
router.use(auth.verifyToken);

/**
 * @route GET /api/device
 * @desc Get all devices
 * @access Private
 */
router.get('/', deviceController.getAllDevices);

/**
 * @route GET /api/device/:id
 * @desc Get device by ID
 * @access Private
 */
router.get('/:id', deviceController.getDeviceById);

/**
 * @route POST /api/device
 * @desc Create a new device
 * @access Private (Admin only)
 */
router.post(
    '/',
    auth.isAdmin,
    validate([
        body('device_id').notEmpty().withMessage('Device ID is required'),
        body('mobil_id').notEmpty().withMessage('Mobil ID is required')
            .isInt().withMessage('Mobil ID must be an integer'),
        body('status').optional().isIn(['online', 'offline']).withMessage('Status must be online or offline')
    ]),
    deviceController.createDevice
);

/**
 * @route PUT /api/device/:id
 * @desc Update a device
 * @access Private (Admin only)
 */
router.put(
    '/:id',
    auth.isAdmin,
    validate([
        body('device_id').optional(),
        body('mobil_id').optional().isInt().withMessage('Mobil ID must be an integer'),
        body('status').optional().isIn(['online', 'offline']).withMessage('Status must be online or offline')
    ]),
    deviceController.updateDevice
);

/**
 * @route DELETE /api/device/:id
 * @desc Delete a device
 * @access Private (Admin only)
 */
router.delete('/:id', auth.isAdmin, deviceController.deleteDevice);

/**
 * @route PUT /api/device/:id/status
 * @desc Update device status
 * @access Private
 */
router.put(
    '/:id/status',
    validate([
        body('status').notEmpty().withMessage('Status is required')
            .isIn(['online', 'offline']).withMessage('Status must be online or offline')
    ]),
    deviceController.updateDeviceStatus
);

module.exports = router;
