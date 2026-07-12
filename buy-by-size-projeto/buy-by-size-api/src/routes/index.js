const express = require('express');

const statusRoutes = require('./status.routes');
const productsRoutes = require('./products.routes');
const rulesRoutes = require('./rules.routes');
const widgetRoutes = require('./widget.routes');
const modelingsRoutes = require('./modelings.routes');
const storeConfigRoutes = require('./storeConfig.routes');
const syncLogsRoutes = require('./syncLogs.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.use(statusRoutes);
router.use(productsRoutes);
router.use(rulesRoutes);
router.use(widgetRoutes);
router.use(modelingsRoutes);
router.use(storeConfigRoutes);
router.use(syncLogsRoutes);
router.use(dashboardRoutes);

module.exports = router;
