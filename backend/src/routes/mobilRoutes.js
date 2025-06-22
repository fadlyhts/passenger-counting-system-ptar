const express = require('express');
const { body } = require('express-validator');
const { mobilController } = require('../controllers');
const { auth } = require('../middleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All mobil routes require authentication
router.use(auth.verifyToken);

/**
 * @route GET /api/mobil
 * @desc Get all mobil (cars)
 * @access Private
 */
router.get('/', mobilController.getAllMobil);

/**
 * @route GET /api/mobil/:id
 * @desc Get mobil by ID
 * @access Private
 */
router.get('/:id', mobilController.getMobilById);

/**
 * @route POST /api/mobil
 * @desc Create a new mobil
 * @access Private (Admin only)
 */
router.post(
    '/',
    auth.isAdmin,
    validate([
        body('mobil_id').optional().isString().withMessage('Mobil ID must be a string')
            .isLength({ min: 1, max: 50 }).withMessage('Mobil ID must be between 1-50 characters'),
        body('nomor_mobil').notEmpty().withMessage('Nomor mobil is required'),
        body('status').optional().isIn(['active', 'maintenance']).withMessage('Status must be active or maintenance')
    ]),
    mobilController.createMobil
);

/**
 * @route PUT /api/mobil/:id
 * @desc Update a mobil
 * @access Private (Admin only)
 */
router.put(
    '/:id',
    auth.isAdmin,
    validate([
        body('mobil_id').optional().isString().withMessage('Mobil ID must be a string')
            .isLength({ min: 1, max: 50 }).withMessage('Mobil ID must be between 1-50 characters'),
        body('nomor_mobil').optional(),
        body('status').optional().isIn(['active', 'maintenance']).withMessage('Status must be active or maintenance')
    ]),
    mobilController.updateMobil
);

/**
 * @route DELETE /api/mobil/:id
 * @desc Delete a mobil
 * @access Private (Admin only)
 */
router.delete('/:id', auth.isAdmin, mobilController.deleteMobil);

/**
 * @route GET /api/mobil/:id/sessions
 * @desc Get mobil session history
 * @access Private
 */
router.get('/:id/sessions', mobilController.getMobilSessionHistory);

module.exports = router;
