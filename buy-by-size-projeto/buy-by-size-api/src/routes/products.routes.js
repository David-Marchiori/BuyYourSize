const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const controller = require('../controllers/products.controller');

const router = express.Router();

router.post('/produtos/sync-xml', authenticateAdmin, controller.syncXml);
router.get('/produtos', authenticateAdmin, controller.listProducts);
router.put('/produtos/:id/vincular', authenticateAdmin, controller.linkProduct);
router.post('/produtos/vincular-mass', authenticateAdmin, controller.linkProductsBatch);
router.post('/produtos/desvincular-mass', authenticateAdmin, controller.unlinkProductsBatch);

module.exports = router;
