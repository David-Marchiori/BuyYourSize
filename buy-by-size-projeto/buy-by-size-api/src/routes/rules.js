const express = require('express');
const supabase = require('../lib/supabase');
const authenticateAdmin = require('../middleware/authenticateAdmin');
const {
  mapRuleWithPhrases,
  serializePhrases,
  buildFootConditions,
  toNumber
} = require('../utils/rules');

const router = express.Router();

router.post('/regras', authenticateAdmin, async (req, res) => {
  const {
    modelagem_id,
    condicoes,
    sugestao_tamanho,
    prioridade,
    pe_min,
    pe_max,
    frase_sugestao,
    frases_sugestao
  } = req.body;

  if (!modelagem_id || !sugestao_tamanho) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando.' });
  }

  const { data: modelagem } = await supabase
    .from('modelagens')
    .select('id, tipo')
    .eq('id', modelagem_id)
    .eq('store_id', req.storeId)
    .single();

  if (!modelagem) {
    return res.status(403).json({ error: 'Modelagem não pertence à sua loja.' });
  }

  try {
    const normalizedCondicoes = Array.isArray(condicoes) ? [...condicoes] : [];
    const isCalcado = (modelagem.tipo || '').toLowerCase() === 'calcado';
    const minVal = toNumber(pe_min);
    const maxVal = toNumber(pe_max);

    if (isCalcado && normalizedCondicoes.length === 0) {
      const autoCondicoes = buildFootConditions(minVal, maxVal);
      if (autoCondicoes.length) normalizedCondicoes.push(...autoCondicoes);
    }

    const { data, error } = await supabase
      .from('regras_detalhes')
      .insert([{
        modelagem_id,
        sugestao_tamanho,
        condicoes: normalizedCondicoes,
        prioridade: prioridade || 0,
        pe_min: minVal,
        pe_max: maxVal,
        frase_sugestao: serializePhrases(frases_sugestao ?? frase_sugestao)
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(mapRuleWithPhrases(data));
  } catch (err) {
    console.error('Erro ao criar regra:', err);
    res.status(500).json({ error: 'Erro ao salvar regra.' });
  }
});

router.get('/regras', authenticateAdmin, async (req, res) => {
  const { modelagem_id } = req.query;
  const { data: modelagem } = await supabase
    .from('modelagens')
    .select('id')
    .eq('id', modelagem_id)
    .eq('store_id', req.storeId)
    .single();

  if (!modelagem) return res.status(403).json({ error: 'Acesso negado.' });

  try {
    const { data: regras } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', modelagem_id)
      .order('pe_min', { ascending: true, nullsFirst: false })
      .order('prioridade', { ascending: false });

    res.status(200).json({ regras: (regras || []).map(mapRuleWithPhrases) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar regras.' });
  }
});

router.put('/regras/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    condicoes,
    sugestao_tamanho,
    prioridade,
    pe_min,
    pe_max,
    frase_sugestao,
    frases_sugestao
  } = req.body;

  const { data: existingRule, error: existingError } = await supabase
    .from('regras_detalhes')
    .select('id, modelagem_id, pe_min, pe_max, modelagens!inner(store_id, tipo)')
    .eq('id', id)
    .single();

  if (existingError || !existingRule) {
    return res.status(404).json({ error: 'Regra não encontrada.' });
  }

  if (existingRule.modelagens?.store_id !== req.storeId) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  const modelingType = (existingRule.modelagens?.tipo || '').toLowerCase();

  try {
    const updatePayload = {};
    if (Array.isArray(condicoes)) updatePayload.condicoes = condicoes;
    if (sugestao_tamanho) updatePayload.sugestao_tamanho = sugestao_tamanho;
    if (prioridade !== undefined) updatePayload.prioridade = prioridade;

    const newMin = pe_min !== undefined ? toNumber(pe_min) : null;
    const newMax = pe_max !== undefined ? toNumber(pe_max) : null;

    if (pe_min !== undefined) updatePayload.pe_min = newMin;
    if (pe_max !== undefined) updatePayload.pe_max = newMax;

    const effectiveMin = pe_min !== undefined ? newMin : toNumber(existingRule.pe_min);
    const effectiveMax = pe_max !== undefined ? newMax : toNumber(existingRule.pe_max);

    if (frases_sugestao !== undefined || frase_sugestao !== undefined) {
      updatePayload.frase_sugestao = serializePhrases(frases_sugestao ?? frase_sugestao);
    }

    if (modelingType === 'calcado') {
      const needsAutoCondicoes = !updatePayload.condicoes || updatePayload.condicoes.length === 0;
      if (needsAutoCondicoes) {
        const autoCondicoes = buildFootConditions(effectiveMin, effectiveMax);
        if (autoCondicoes.length) {
          updatePayload.condicoes = autoCondicoes;
        }
      }
    }

    const { error: updateError, data: updateData } = await supabase
      .from('regras_detalhes')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      message: 'Regra atualizada!',
      regra: mapRuleWithPhrases(updateData[0])
    });
  } catch (error) {
    console.error('Erro atualização regra:', error.message);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.delete('/regras/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('regras_detalhes').delete().eq('id', id);
    if (error) throw error;
    res.status(200).json({ success: true, message: 'Regra excluída!', deleted_id: id });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir regra.' });
  }
});

router.get('/regras/stats', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('regras_detalhes')
      .select('regra_mestre_id');

    if (error) {
      console.error('Erro ao buscar stats:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }

    const stats = {};
    data.forEach(item => {
      const id = item.regra_mestre_id;
      stats[id] = (stats[id] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Erro geral stats:', error);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

router.get('/regras/:modelagemId', authenticateAdmin, async (req, res) => {
  const { modelagemId } = req.params;

  try {
    const { data, error } = await supabase
      .from('regras_detalhes')
      .select('*')
      .eq('modelagem_id', modelagemId)
      .order('pe_min', { ascending: true, nullsFirst: false })
      .order('prioridade', { ascending: true });

    if (error) throw error;
    res.json((data || []).map(mapRuleWithPhrases));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar regras.' });
  }
});

module.exports = router;
