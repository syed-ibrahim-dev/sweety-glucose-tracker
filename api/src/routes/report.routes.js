
const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth.middleware');

const {
  daily,
  monthToDate,
  previousMonth,
  exportCsv,
} = require('../controllers/report.controller');

// All report routes require authentication
router.use(authenticate);

// GET: Daily report
router.get('/daily', daily);

// GET: Month-to-date report
router.get('/month-to-date', monthToDate);

// GET: Previous complete month report
router.get('/previous-month', previousMonth);

// GET: CSV export
// Example: /api/reports/export?type=daily&date=2026-11-22
router.get('/export', exportCsv);

module.exports = router;
