const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const controller = require('../controllers/status.controller');

const router = express.Router();

router.get('/status', authenticateAdmin, controller.getStatus);

module.exports = router;
