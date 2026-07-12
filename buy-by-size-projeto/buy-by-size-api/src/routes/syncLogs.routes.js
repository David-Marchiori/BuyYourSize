const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const controller = require('../controllers/syncLogs.controller');

const router = express.Router();

router.get('/sync-logs', authenticateAdmin, controller.listRecentLogs);

module.exports = router;
