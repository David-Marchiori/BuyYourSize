const asyncHandler = require('../utils/asyncHandler');
const modelingsService = require('../services/modelings.service');

const listModelings = asyncHandler(async (req, res) => {
  const result = await modelingsService.listModelings(req.storeId);
  res.json(result);
});

const createModeling = asyncHandler(async (req, res) => {
  const { nome, tipo } = req.body;
  const data = await modelingsService.createModeling({ nome, tipo, storeId: req.storeId });
  res.status(201).json(data);
});

const getModelingById = asyncHandler(async (req, res) => {
  const data = await modelingsService.getModelingById(req.params.id, req.storeId);
  res.json(data);
});

const listProductsByModeling = asyncHandler(async (req, res) => {
  const data = await modelingsService.listProductsByModeling(req.params.id, req.storeId);
  res.json(data);
});

const deleteModeling = asyncHandler(async (req, res) => {
  await modelingsService.deleteModeling(req.params.id, req.storeId);
  res.json({ success: true, message: 'Modelagem e regras excluídas com sucesso.' });
});

module.exports = {
  listModelings,
  createModeling,
  getModelingById,
  listProductsByModeling,
  deleteModeling
};
