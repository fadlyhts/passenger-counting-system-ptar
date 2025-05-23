const jwt = require('jsonwebtoken');
const config = require('../config');
const { BlacklistedToken } = require('../models');

/**
 * Middleware to verify JWT token
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                status: 'error',
                message: 'No token provided',
                data: null
            });
        }

        // Check if the token format is correct (Bearer token)
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                status: 'error',
                message: 'Token error',
                data: null
            });
        }

        const token = parts[1];

        // Check if token is blacklisted
        const blacklistedToken = await BlacklistedToken.findOne({
            where: { token }
        });

        if (blacklistedToken) {
            return res.status(401).json({
                status: 'error',
                message: 'Token has been revoked',
                data: null
            });
        }

        // Verify the token
        jwt.verify(token, config.jwt.secret, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid token',
                    data: null
                });
            }

            // Add user info to request
            req.user = decoded;
            next();
        });
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            data: null
        });
    }
};

/**
 * Middleware to check if user is an admin
 */
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Admin role required',
            data: null
        });
    }
};

/**
 * Middleware to check if user is a driver
 */
const isDriver = (req, res, next) => {
    if (req.user && req.user.role === 'driver') {
        next();
    } else {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied. Driver role required',
            data: null
        });
    }
};

module.exports = {
    verifyToken,
    isAdmin,
    isDriver
};
