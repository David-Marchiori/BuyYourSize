const express = require('express');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const controller = require('../controllers/rules.controller');

const router = express.Router();

// /regras/stats precisa ser registrada antes de /regras/:modelagemId,
// senão o Express casaria "stats" como valor do parâmetro :modelagemId.
router.post('/regras', authenticateAdmin, controller.createRule);
router.get('/regras/stats', authenticateAdmin, controller.getRuleStats);
router.get('/regras', authenticateAdmin, controller.listRulesByModeling);
router.put('/regras/:id', authenticateAdmin, controller.updateRule);
router.delete('/regras/:id', authenticateAdmin, controller.deleteRule);
router.get('/regras/:modelagemId', authenticateAdmin, controller.listRulesByModelingIdParam);

module.exports = router;
