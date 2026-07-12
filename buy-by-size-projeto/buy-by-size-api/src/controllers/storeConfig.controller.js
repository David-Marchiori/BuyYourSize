const asyncHandler = require('../utils/asyncHandler');
const storeConfigService = require('../services/storeConfig.service');

const getConfig = asyncHandler(async (req, res) => {
  const data = await storeConfigService.getConfig(req.storeId);
  res.json(data);
});

const saveConfig = asyncHandler(async (req, res) => {
  await storeConfigService.saveConfig(req.storeId, req.body);
  res.json({ success: true, message: 'Configuração salva' });
});

module.exports = { getConfig, saveConfig };
