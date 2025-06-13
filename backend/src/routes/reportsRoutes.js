const express = require('express');
const { reportsController } = require('../controllers');
const { auth } = require('../middleware');

const router = express.Router();

// All reports routes require authentication
router.use(auth.verifyToken);

/**
 * @route GET /api/reports/daily
 * @desc Get daily passenger count report
 * @access Private
 */
router.get('/daily', reportsController.getDailyReport);

/**
 * @route GET /api/reports/weekly
 * @desc Get weekly passenger count report
 * @access Private
 */
router.get('/weekly', reportsController.getWeeklyReport);

/**
 * @route GET /api/reports/monthly
 * @desc Get monthly passenger count report
 * @access Private
 */
router.get('/monthly', reportsController.getMonthlyReport);

/**
 * @route GET /api/reports/driver
 * @desc Get driver performance report
 * @access Private
 */
router.get('/driver', reportsController.getDriverReport);

/**
 * @route GET /api/reports/mobil
 * @desc Get mobil usage report
 * @access Private
 */
router.get('/mobil', reportsController.getMobilReport);

module.exports = router;
