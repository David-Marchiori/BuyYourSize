const express = require('express');
const controller = require('../controllers/widget.controller');

const router = express.Router();

// Rotas públicas: usadas pelo widget embutido na loja, sem autenticação de admin.
router.post('/sugestao', controller.getSuggestion);
router.get('/widget/check/:produtoId', controller.checkAvailability);

module.exports = router;
