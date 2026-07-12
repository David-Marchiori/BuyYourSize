const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../errors/AppError');
const rulesService = require('../services/rules.service');

const createRule = asyncHandler(async (req, res) => {
  const {
    modelagem_id: modelagemId,
    condicoes,
    sugestao_tamanho: sugestaoTamanho,
    prioridade,
    pe_min: peMin,
    pe_max: peMax,
    frase_sugestao: fraseSugestao,
    frases_sugestao: frasesSugestao
  } = req.body;

  const rule = await rulesService.createRule({
    storeId: req.storeId,
    modelagemId,
    condicoes,
    sugestaoTamanho,
    prioridade,
    peMin,
    peMax,
    fraseSugestao,
    frasesSugestao
  });

  res.status(201).json(rule);
});

const listRulesByModeling = asyncHandler(async (req, res) => {
  const { modelagem_id: modelagemId } = req.query;
  if (!modelagemId) throw new AppError(400, 'modelagem_id é obrigatório.');

  const regras = await rulesService.listRulesByModeling(modelagemId, req.storeId);
  res.status(200).json({ regras });
});

const updateRule = asyncHandler(async (req, res) => {
  const regra = await rulesService.updateRule(req.params.id, req.storeId, req.body);
  res.status(200).json({ success: true, message: 'Regra atualizada!', regra });
});

const deleteRule = asyncHandler(async (req, res) => {
  await rulesService.deleteRule(req.params.id, req.storeId);
  res.status(200).json({ success: true, message: 'Regra excluída!', deleted_id: req.params.id });
});

const getRuleStats = asyncHandler(async (req, res) => {
  const stats = await rulesService.getRuleStats(req.storeId);
  res.json(stats);
});

const listRulesByModelingIdParam = asyncHandler(async (req, res) => {
  const regras = await rulesService.listRulesByModelingIdParam(req.params.modelagemId, req.storeId);
  res.json(regras);
});

module.exports = {
  createRule,
  listRulesByModeling,
  updateRule,
  deleteRule,
  getRuleStats,
  listRulesByModelingIdParam
};
