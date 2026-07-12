const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const controller = require('../controllers/modelings.controller');

const router = express.Router();

router.get('/modelagens', authenticateAdmin, controller.listModelings);
router.post('/modelagens', authenticateAdmin, controller.createModeling);
router.get('/modelagens/:id', authenticateAdmin, controller.getModelingById);
router.get('/modelagens/:id/produtos', authenticateAdmin, controller.listProductsByModeling);
router.delete('/modelagens/:id', authenticateAdmin, controller.deleteModeling);

module.exports = router;
