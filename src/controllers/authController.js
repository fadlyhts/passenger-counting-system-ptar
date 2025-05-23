const { Admin, Driver, DriverLoginHistory, BlacklistedToken } = require('../models');
const { formatResponse, formatError, generateToken, getTokenExpiration } = require('../utils');

/**
 * Admin login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find admin by username
        const admin = await Admin.findOne({ where: { username } });
        
        // Log the query result for debugging
        console.log("Admin query result:", admin);
        
        if (!admin) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials',
                data: null
            });
        }

        // Check if admin is active
        if (admin.status !== 'active') {
            return res.status(401).json({
                status: 'error',
                message: 'Account is inactive',
                data: null
            });
        }

        // Validate password
        const isPasswordValid = await admin.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials',
                data: null
            });
        }

        // Generate JWT token
        const token = generateToken({
            id: admin.id,
            username: admin.username,
            role: 'admin'
        }, process.env.JWT_EXPIRATION);

        // Update last login
        await admin.update({ last_login: new Date() });

        return res.json(formatResponse({
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name,
                role: admin.role,
                email: admin.email
            }
        }, 'Login successful'));
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            status: 'error',
            message: error ? error.message : 'An error occurred',
            data: null
        });
    }
};

/**
 * Driver login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const driverLogin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const ipAddress = req.ip;
        const deviceInfo = req.headers['user-agent'] || '';

        // Find driver by username
        const driver = await Driver.findOne({ where: { username } });
        
        // Create login history entry
        const loginHistory = {
            driver_id: driver ? driver.id : null,
            login_time: new Date(),
            ip_address: ipAddress,
            device_info: deviceInfo,
            login_status: 'failed'
        };

        if (!driver) {
            await DriverLoginHistory.create(loginHistory);
            return res.status(401).json(formatError(null, 'Invalid credentials'));
        }

        // Check if driver is active
        if (driver.status !== 'active') {
            await DriverLoginHistory.create({
                ...loginHistory,
                driver_id: driver.id
            });
            return res.status(401).json(formatError(null, 'Account is inactive'));
        }

        // Validate password
        const isPasswordValid = await driver.validatePassword(password);
        if (!isPasswordValid) {
            await DriverLoginHistory.create({
                ...loginHistory,
                driver_id: driver.id
            });
            return res.status(401).json(formatError(null, 'Invalid credentials'));
        }

        // Generate JWT token
        const token = generateToken({
            id: driver.id,
            username: driver.username,
            role: 'driver'
        }, process.env.JWT_EXPIRATION);

        // Update last login
        await driver.update({ last_login: new Date() });

        // Create successful login history
        await DriverLoginHistory.create({
            ...loginHistory,
            driver_id: driver.id,
            login_status: 'success'
        });

        return res.json(formatResponse({
            token,
            driver: {
                id: driver.id,
                username: driver.username,
                name: driver.nama_driver,
                rfid_code: driver.rfid_code,
                email: driver.email
            }
        }, 'Login successful'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

/**
 * Logout
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(400).json(formatError(null, 'No token provided', 400));
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(400).json(formatError(null, 'Token format invalid', 400));
        }

        const token = parts[1];
        const expiresAt = getTokenExpiration(token);

        if (!expiresAt) {
            return res.status(400).json(formatError(null, 'Invalid token', 400));
        }

        // Add token to blacklist
        await BlacklistedToken.create({
            token,
            blacklisted_at: new Date(),
            expires_at: expiresAt
        });

        // If it's a driver, update the login history
        if (req.user && req.user.role === 'driver') {
            const latestLogin = await DriverLoginHistory.findOne({
                where: {
                    driver_id: req.user.id,
                    login_status: 'success',
                    logout_time: null
                },
                order: [['login_time', 'DESC']]
            });

            if (latestLogin) {
                await latestLogin.update({
                    logout_time: new Date()
                });
            }
        }

        return res.json(formatResponse(null, 'Logout successful'));
    } catch (error) {
        return res.status(500).json(formatError(error));
    }
};

module.exports = {
    adminLogin,
    driverLogin,
    logout
};
