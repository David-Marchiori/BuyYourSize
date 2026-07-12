const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../errors/AppError');
const productsService = require('../services/products.service');

const syncXml = asyncHandler(async (req, res) => {
  const { xmlUrl } = req.body;
  const { syncedCount } = await productsService.syncFromXmlFeed(xmlUrl, req.storeId);

  res.json({
    success: true,
    synced_count: syncedCount,
    message: `${syncedCount} produtos sincronizados.`
  });
});

const listProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, q = '', modelagem_id: modelagemId } = req.query;
  const result = await productsService.listProducts({
    storeId: req.storeId,
    page,
    limit,
    q,
    modelagemId
  });
  res.json(result);
});

const linkProduct = asyncHandler(async (req, res) => {
  const { modelagem_id: modelagemId } = req.body;
  await productsService.linkProduct({
    storeId: req.storeId,
    productId: req.params.id,
    modelagemId
  });
  res.json({ success: true, message: 'Produto vinculado com sucesso.' });
});

const linkProductsBatch = asyncHandler(async (req, res) => {
  const { product_ids: productIds, modelagem_id: modelagemId } = req.body;

  if (!productIds || !Array.isArray(productIds)) {
    throw new AppError(400, 'Lista inválida.');
  }

  await productsService.linkProductsBatch({ storeId: req.storeId, productIds, modelagemId });
  res.json({ success: true, message: 'Produtos vinculados.' });
});

const unlinkProductsBatch = asyncHandler(async (req, res) => {
  const { product_ids: productIds } = req.body;
  await productsService.unlinkProductsBatch({ storeId: req.storeId, productIds });
  res.json({ success: true, message: 'Produtos desvinculados.' });
});

module.exports = {
  syncXml,
  listProducts,
  linkProduct,
  linkProductsBatch,
  unlinkProductsBatch
};
