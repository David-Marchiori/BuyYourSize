const express = require('express');
const supabase = require('../lib/supabase');
const authenticateAdmin = require('../middleware/authenticateAdmin');

const router = express.Router();

router.get('/modelagens', authenticateAdmin, async (req, res) => {
  try {
    const { data: modelagens } = await supabase
      .from('modelagens')
      .select('*')
      .eq('store_id', req.storeId)
      .order('created_at', { ascending: false });

    const { data: produtos } = await supabase
      .from('produtos_tamanhos')
      .select('modelagem_id')
      .eq('store_id', req.storeId);

    const counts = {};
    if (produtos) {
      produtos.forEach(p => {
        if (p.modelagem_id) counts[p.modelagem_id] = (counts[p.modelagem_id] || 0) + 1;
      });
    }

    const result = (modelagens || []).map(m => ({
      ...m,
      total_produtos: counts[m.id] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar modelagens.' });
  }
});

router.post('/modelagens', authenticateAdmin, async (req, res) => {
  const { nome, tipo } = req.body;

  try {
    const { data, error } = await supabase
      .from('modelagens')
      .insert([{
        nome,
        store_id: req.storeId,
        tipo: tipo || 'roupa'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Erro ao criar modelagem:', err);
    res.status(500).json({ error: 'Erro ao criar modelagem.' });
  }
});

router.get('/modelagens/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('modelagens')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Erro ao buscar detalhes da modelagem:', err);
    res.status(500).json({ error: 'Erro ao buscar modelagem.' });
  }
});

router.get('/modelagens/:id/produtos', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('produtos_tamanhos')
      .select('*')
      .eq('modelagem_id', id)
      .eq('store_id', req.storeId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos vinculados.' });
  }
});

router.delete('/modelagens/:id', authenticateAdmin, async (req, res) => {
  const { id: modelagemId } = req.params;

  try {
    const { data: modelagem, error: checkError } = await supabase
      .from('modelagens')
      .select('id, store_id')
      .eq('id', modelagemId)
      .eq('store_id', req.storeId)
      .single();

    if (checkError || !modelagem) {
      return res.status(404).json({ error: 'Modelagem não encontrada ou acesso negado.' });
    }

    await supabase
      .from('produtos_tamanhos')
      .update({ modelagem_id: null })
      .eq('modelagem_id', modelagemId)
      .eq('store_id', req.storeId);

    await supabase
      .from('regras_detalhes')
      .delete()
      .eq('modelagem_id', modelagemId);

    const { error: deleteError } = await supabase
      .from('modelagens')
      .delete()
      .eq('id', modelagemId);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: 'Modelagem e regras excluídas com sucesso.' });
  } catch (err) {
    console.error('Erro ao excluir modelagem:', err);
    res.status(500).json({ error: 'Erro interno ao excluir modelagem.' });
  }
});

module.exports = router;
