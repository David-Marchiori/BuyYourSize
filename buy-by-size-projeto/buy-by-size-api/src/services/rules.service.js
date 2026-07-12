const supabase = require('../lib/supabaseClient');
const AppError = require('../errors/AppError');
const { assertModelingOwnedByStore } = require('./modelings.service');
const {
  mapRuleWithPhrases,
  serializePhrases,
  buildFootConditions,
  toNumber
} = require('../utils/rules');

const createRule = async ({
  storeId,
  modelagemId,
  condicoes,
  sugestaoTamanho,
  prioridade,
  peMin,
  peMax,
  fraseSugestao,
  frasesSugestao
}) => {
  if (!modelagemId || !sugestaoTamanho) {
    throw new AppError(400, 'Dados obrigatórios faltando.');
  }

  const modelagem = await assertModelingOwnedByStore(modelagemId, storeId, 'id, tipo');

  const normalizedCondicoes = Array.isArray(condicoes) ? [...condicoes] : [];
  const isCalcado = (modelagem.tipo || '').toLowerCase() === 'calcado';
  const minVal = toNumber(peMin);
  const maxVal = toNumber(peMax);

  if (isCalcado && normalizedCondicoes.length === 0) {
    const autoCondicoes = buildFootConditions(minVal, maxVal);
    if (autoCondicoes.length) normalizedCondicoes.push(...autoCondicoes);
  }

  const { data, error } = await supabase
    .from('regras_detalhes')
    .insert([
      {
        modelagem_id: modelagemId,
        sugestao_tamanho: sugestaoTamanho,
        condicoes: normalizedCondicoes,
        prioridade: prioridade || 0,
        pe_min: minVal,
        pe_max: maxVal,
        frase_sugestao: serializePhrases(frasesSugestao ?? fraseSugestao)
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return mapRuleWithPhrases(data);
};

const listRulesByModeling = async (modelagemId, storeId) => {
  await assertModelingOwnedByStore(modelagemId, storeId, 'id');

  const { data: regras, error } = await supabase
    .from('regras_detalhes')
    .select('*')
    .eq('modelagem_id', modelagemId)
    .order('pe_min', { ascending: true, nullsFirst: false })
    .order('prioridade', { ascending: false });

  if (error) throw error;
  return (regras || []).map(mapRuleWithPhrases);
};

const getRuleOwnedByStore = async (id, storeId) => {
  const { data: rule, error } = await supabase
    .from('regras_detalhes')
    .select('id, modelagem_id, pe_min, pe_max, modelagens!inner(store_id, tipo)')
    .eq('id', id)
    .single();

  if (error || !rule || rule.modelagens?.store_id !== storeId) {
    return null;
  }

  return rule;
};

const updateRule = async (id, storeId, payload) => {
  const existingRule = await getRuleOwnedByStore(id, storeId);
  if (!existingRule) throw new AppError(404, 'Regra não encontrada.');

  const {
    condicoes,
    sugestao_tamanho: sugestaoTamanho,
    prioridade,
    pe_min: peMin,
    pe_max: peMax,
    frase_sugestao: fraseSugestao,
    frases_sugestao: frasesSugestao
  } = payload;

  const modelingType = (existingRule.modelagens?.tipo || '').toLowerCase();
  const updatePayload = {};

  if (Array.isArray(condicoes)) updatePayload.condicoes = condicoes;
  if (sugestaoTamanho) updatePayload.sugestao_tamanho = sugestaoTamanho;
  if (prioridade !== undefined) updatePayload.prioridade = prioridade;

  const newMin = peMin !== undefined ? toNumber(peMin) : null;
  const newMax = peMax !== undefined ? toNumber(peMax) : null;

  if (peMin !== undefined) updatePayload.pe_min = newMin;
  if (peMax !== undefined) updatePayload.pe_max = newMax;

  const effectiveMin = peMin !== undefined ? newMin : toNumber(existingRule.pe_min);
  const effectiveMax = peMax !== undefined ? newMax : toNumber(existingRule.pe_max);

  if (frasesSugestao !== undefined || fraseSugestao !== undefined) {
    updatePayload.frase_sugestao = serializePhrases(frasesSugestao ?? fraseSugestao);
  }

  if (modelingType === 'calcado') {
    const needsAutoCondicoes = !updatePayload.condicoes || updatePayload.condicoes.length === 0;
    if (needsAutoCondicoes) {
      const autoCondicoes = buildFootConditions(effectiveMin, effectiveMax);
      if (autoCondicoes.length) updatePayload.condicoes = autoCondicoes;
    }
  }

  const { error, data } = await supabase
    .from('regras_detalhes')
    .update(updatePayload)
    .eq('id', id)
    .select();

  if (error) throw error;
  return mapRuleWithPhrases(data[0]);
};

const deleteRule = async (id, storeId) => {
  const existingRule = await getRuleOwnedByStore(id, storeId);
  if (!existingRule) throw new AppError(404, 'Regra não encontrada.');

  const { error } = await supabase.from('regras_detalhes').delete().eq('id', id);
  if (error) throw error;
};

const getRuleStats = async (storeId) => {
  const { data, error } = await supabase
    .from('regras_detalhes')
    .select('regra_mestre_id, modelagens!inner(store_id)')
    .eq('modelagens.store_id', storeId);

  if (error) throw error;

  const stats = {};
  (data || []).forEach((item) => {
    const id = item.regra_mestre_id;
    stats[id] = (stats[id] || 0) + 1;
  });

  return stats;
};

const listRulesByModelingIdParam = async (modelagemId, storeId) => {
  await assertModelingOwnedByStore(modelagemId, storeId, 'id');

  const { data, error } = await supabase
    .from('regras_detalhes')
    .select('*')
    .eq('modelagem_id', modelagemId)
    .order('pe_min', { ascending: true, nullsFirst: false })
    .order('prioridade', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapRuleWithPhrases);
};

module.exports = {
  createRule,
  listRulesByModeling,
  updateRule,
  deleteRule,
  getRuleStats,
  listRulesByModelingIdParam
};
