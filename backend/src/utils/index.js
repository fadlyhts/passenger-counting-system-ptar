/**
 * Format success response
 * @param {*} data - Response data
 * @param {string} message - Response message
 * @returns {Object} Formatted response object
 */
const formatResponse = (data, message = 'Success') => {
    return {
        status: 'success',
        message,
        data
    };
};

/**
 * Format error response
 * @param {Error} error - Error object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Formatted error object
 */
const formatError = (error, message = 'An error occurred', statusCode = 500) => {
    if (error) {
        console.error(error);
    }
    
    return {
        status: 'error',
        message: message || (error ? error.message : 'An error occurred'),
        data: null,
        stack: undefined
    };
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '1h') => {
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    
    return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

/**
 * Parse token expiration date
 * @param {string} token - JWT token
 * @returns {Date} Expiration date
 */
const getTokenExpiration = (token) => {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(token);
    
    if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
    }
    
    return null;
};

/**
 * Format date to Jakarta timezone (UTC+7)
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time in the formatted date
 * @returns {string} Formatted date string
 */
const formatDate = (date, includeTime = true) => {
    const d = date instanceof Date ? date : new Date(date);
    
    // Format options
    const options = {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.second = '2-digit';
        options.hour12 = false;
    }
    
    return new Intl.DateTimeFormat('id-ID', options).format(d);
};

/**
 * Get current date in Jakarta timezone (UTC+7)
 * @param {boolean} includeTime - Whether to include time
 * @returns {Date} Current date in Jakarta timezone
 */
const getCurrentDate = (includeTime = true) => {
    const now = new Date();
    
    if (!includeTime) {
        now.setHours(0, 0, 0, 0);
    }
    
    return now;
};

module.exports = {
    formatResponse,
    formatError,
    generateToken,
    getTokenExpiration,
    formatDate,
    getCurrentDate
};