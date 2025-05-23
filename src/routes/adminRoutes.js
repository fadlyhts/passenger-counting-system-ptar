const express = require('express');
const { body } = require('express-validator');
const { adminController } = require('../controllers');
const { auth } = require('../middleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All admin routes require admin authentication
router.use(auth.verifyToken, auth.isAdmin);

/**
 * \@route GET /api/admin
 * @desc Get all admins
 * @access Private (Admin only)
 */
router.get('/', adminController.getAllAdmins);

/**
 * @route GET /api/admin/:id
 * @desc Get admin by ID
 * @access Private (Admin only)
 */
router.get('/:id', adminController.getAdminById);

/**
 * @route POST /api/admin
 * @desc Create a new admin
 * @access Private (Admin only)
 */
router.post(
    '/',
    validate([
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('name').notEmpty().withMessage('Name is required'),
        body('role').notEmpty().withMessage('Role is required'),
        body('email').notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format')
    ]),
    adminController.createAdmin
);

/**
 * @route PUT /api/admin/:id
 * @desc Update an admin
 * @access Private (Admin only)
 */
router.put(
    '/:id',
    validate([
        body('name').optional(),
        body('role').optional(),
        body('email').optional().isEmail().withMessage('Invalid email format'),
        body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ]),
    adminController.updateAdmin
);

/**
 * @route DELETE /api/admin/:id
 * @desc Delete an admin
 * @access Private (Admin only)
 */
router.delete('/:id', adminController.deleteAdmin);

module.exports = router;
