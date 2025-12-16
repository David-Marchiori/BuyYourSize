const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const supabase = require('../lib/supabase');
const authenticateAdmin = require('../middleware/authenticateAdmin');

const router = express.Router();

router.post('/produtos/sync-xml', authenticateAdmin, async (req, res) => {
  const { xmlUrl } = req.body;

  if (!xmlUrl) {
    return res.status(400).json({ error: 'A URL do feed XML é obrigatória.' });
  }

  try {
    const xmlResponse = await axios.get(xmlUrl);
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(xmlResponse.data);

    const itemsPath = result.rss?.channel?.item || result.feed?.entry || [];
    const itemsArray = Array.isArray(itemsPath) ? itemsPath : [itemsPath];

    const produtosParaSincronizar = itemsArray.map(item => ({
      produto_id: item['g:id'] || item.link || null,
      nome_regra: item['g:title'] || 'Produto sem nome',
      store_id: req.storeId,
      campos_necessarios: {},
      status: 'ativo'
    })).filter(p => p.produto_id !== null);

    if (produtosParaSincronizar.length === 0) {
      throw new Error('Nenhum produto encontrado no XML.');
    }

    const { error: dbError, data: dbData } = await supabase
      .from('produtos_tamanhos')
      .upsert(produtosParaSincronizar, { onConflict: 'produto_id' })
      .select();

    if (dbError) throw dbError;

    await supabase.from('sync_logs').insert([{
      store_id: req.storeId,
      status: 'success',
      details: `${dbData ? dbData.length : 0} produtos processados.`
    }]);

    res.json({
      success: true,
      synced_count: dbData ? dbData.length : 0,
      message: `${dbData ? dbData.length : 0} produtos sincronizados.`
    });
  } catch (error) {
    console.error('Erro no processamento do XML:', error.message);
    await supabase.from('sync_logs').insert([{
      store_id: req.storeId,
      status: 'error',
      details: `Falha: ${error.message || 'Erro desconhecido'}`
    }]);
    res.status(500).json({ error: 'Erro ao processar XML.', details: error.message });
  }
});

router.get('/produtos', authenticateAdmin, async (req, res) => {
  const { page = 1, limit = 50, q = '', modelagem_id } = req.query;

  try {
    let query = supabase
      .from('produtos_tamanhos')
      .select('produto_id, nome_regra, status, id, modelagem_id', { count: 'exact' })
      .eq('store_id', req.storeId);

    if (q) {
      query = query.or(`nome_regra.ilike.%${q}%,produto_id.ilike.%${q}%`);
    }

    if (modelagem_id) {
      query = query.eq('modelagem_id', modelagem_id);
    } else {
      const from = (page - 1) * limit;
      const to = from + parseInt(limit, 10) - 1;
      query = query.range(from, to);
    }

    const { data, count } = await query.order('nome_regra', { ascending: true });
    res.json({ produtos: data, total: count });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar produtos.' });
  }
});

router.put('/produtos/:id/vincular', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { modelagem_id } = req.body;

  try {
    if (modelagem_id) {
      const { data: modCheck } = await supabase
        .from('modelagens')
        .select('id')
        .eq('id', modelagem_id)
        .eq('store_id', req.storeId)
        .single();

      if (!modCheck) return res.status(403).json({ error: 'Modelagem inválida ou de outra loja.' });
    }

    const { error, data } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id })
      .eq('id', id)
      .eq('store_id', req.storeId)
      .select();

    if (error) throw error;
    if (!data || !data.length) return res.status(404).json({ error: 'Produto não encontrado.' });

    res.json({ success: true, message: 'Produto vinculado com sucesso.' });
  } catch (err) {
    console.error('Erro vincular:', err);
    res.status(500).json({ error: 'Erro ao vincular produto.' });
  }
});

router.post('/produtos/vincular-mass', authenticateAdmin, async (req, res) => {
  const { product_ids, modelagem_id } = req.body;

  if (!product_ids || !Array.isArray(product_ids)) {
    return res.status(400).json({ error: 'Lista inválida.' });
  }

  try {
    const { data: modCheck } = await supabase
      .from('modelagens')
      .select('id')
      .eq('id', modelagem_id)
      .eq('store_id', req.storeId)
      .single();

    if (!modCheck) return res.status(403).json({ error: 'Acesso negado à modelagem.' });

    const { error } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id })
      .in('id', product_ids)
      .eq('store_id', req.storeId);

    if (error) throw error;
    res.json({ success: true, message: 'Produtos vinculados.' });
  } catch (err) {
    console.error('Erro vínculo em massa:', err);
    res.status(500).json({ error: 'Erro ao vincular produtos.' });
  }
});

router.post('/produtos/desvincular-mass', authenticateAdmin, async (req, res) => {
  const { product_ids } = req.body;

  try {
    const { error } = await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: null })
      .in('id', product_ids)
      .eq('store_id', req.storeId);

    if (error) throw error;
    res.json({ success: true, message: 'Produtos desvinculados.' });
  } catch (err) {
    console.error('Erro desvincular:', err);
    res.status(500).json({ error: 'Erro ao desvincular.' });
  }
});

module.exports = router;
