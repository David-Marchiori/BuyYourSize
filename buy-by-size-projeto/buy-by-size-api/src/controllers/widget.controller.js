const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../errors/AppError');
const widgetService = require('../services/widget.service');

const getSuggestion = asyncHandler(async (req, res) => {
  const { produto_id: produtoId, medidas, store_id: storeId } = req.body;

  if (!produtoId || !medidas || !storeId) {
    throw new AppError(400, 'Dados incompletos.');
  }

  const result = await widgetService.getSuggestion({ produtoId, medidas, storeId });
  res.status(200).json(result);
});

const checkAvailability = asyncHandler(async (req, res) => {
  const { produtoId } = req.params;
  const { storeId } = req.query;

  if (!storeId) {
    console.warn('Widget check sem storeId');
  }

  const result = await widgetService.checkWidgetAvailability(produtoId, storeId);
  res.json(result);
});

module.exports = { getSuggestion, checkAvailability };
