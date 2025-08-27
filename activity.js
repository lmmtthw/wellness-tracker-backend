// routes/activity.js
const express = require('express');
const router = express.Router();
const { logActivity, getActivityLogs } = require('../controllers/activityController');

// POST /activity - Log wellness activity
router.post('/', logActivity);

// GET /activity/:userId - Retrieve logs for a user by date range
router.get('/:userId', getActivityLogs);

module.exports = router;
