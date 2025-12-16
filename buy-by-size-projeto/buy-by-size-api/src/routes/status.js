const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');

const router = express.Router();

router.get('/status', authenticateAdmin, (req, res) => {
  res.json({
    status: 'ok',
    service: 'Buy by Size API',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
