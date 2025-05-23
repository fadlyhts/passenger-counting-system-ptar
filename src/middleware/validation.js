const { validationResult } = require('express-validator');

/**
 * Middleware to validate request data
 * @param {Array} validations - Array of express-validator validations
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Execute all validations
        await Promise.all(validations.map(validation => validation.run(req)));
        
        // Check if there are validation errors
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        
        // Return validation errors
        return res.status(400).json({
            status: 'error',
            message: 'Validation error',
            data: {
                errors: errors.array()
            }
        });
    };
};

module.exports = {
    validate
};
