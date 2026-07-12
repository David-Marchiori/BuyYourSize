const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const controller = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/dashboard/stats', authenticateAdmin, controller.getStats);
router.get('/dashboard/kpis', authenticateAdmin, controller.getKpis);
// Alias: o admin-panel chama /api/analytics/kpis (ver admin-panel/src/api/apiService.js).
router.get('/analytics/kpis', authenticateAdmin, controller.getKpis);

module.exports = router;
