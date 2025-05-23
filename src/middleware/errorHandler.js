/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Default error status and message
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    // Send error response
    res.status(status).json({
        status: 'error',
        message,
        data: null,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

/**
 * 404 Not Found middleware
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
};

module.exports = {
    errorHandler,
    notFound
};
