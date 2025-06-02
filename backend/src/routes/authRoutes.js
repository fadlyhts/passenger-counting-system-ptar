const express = require('express');
const { body } = require('express-validator');
const { authController } = require('../controllers');
const { auth } = require('../middleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route POST /api/auth/admin/login
 * @desc Admin login
 * @access Public
 */
router.post(
    '/admin/login',
    validate([
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ]),
    authController.adminLogin
);

/**
 * @route POST /api/auth/driver/login
 * @desc Driver login
 * @access Public
 */
router.post(
    '/driver/login',
    validate([
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ]),
    authController.driverLogin
);

/**
 * @route POST /api/auth/logout
 * @desc Logout (blacklist token)
 * @access Private
 */
router.post(
    '/logout',
    auth.verifyToken,
    authController.logout
);

module.exports = router;
