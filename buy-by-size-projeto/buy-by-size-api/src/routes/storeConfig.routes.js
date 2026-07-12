const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const controller = require('../controllers/storeConfig.controller');

const router = express.Router();

router.get('/store-config', authenticateAdmin, controller.getConfig);
router.post('/store-config', authenticateAdmin, controller.saveConfig);

module.exports = router;
