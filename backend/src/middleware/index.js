const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFound } = require('./errorHandler');
const auth = require('./auth');
const validation = require('./validation');

const router = express.Router();

// Apply security middleware
router.use(helmet());
router.use(cors());

// Request logging middleware
router.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

module.exports = {
    router,
    auth,
    validation,
    errorHandler,
    notFound
};
