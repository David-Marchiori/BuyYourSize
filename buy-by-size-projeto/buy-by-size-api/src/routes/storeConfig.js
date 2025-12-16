const express = require('express');
const supabase = require('../lib/supabase');
const authenticateAdmin = require('../middleware/authenticateAdmin');

const router = express.Router();

router.get('/store-config', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .eq('store_id', req.storeId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return res.status(404).json({ error: 'Configura‡Æo nÆo encontrada' });

    res.json(data);
  } catch (err) {
    console.error('Erro buscar config:', err);
    res.status(500).json({ error: 'Erro ao buscar configura‡äes' });
  }
});

router.post('/store-config', authenticateAdmin, async (req, res) => {
  const settings = req.body;
  const payload = { ...settings, store_id: req.storeId };
  delete payload.id;

  try {
    const { data: existing } = await supabase
      .from('store_config')
      .select('id')
      .eq('store_id', req.storeId)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('store_config')
        .update(payload)
        .eq('id', existing.id)
        .eq('store_id', req.storeId);
    } else {
      result = await supabase
        .from('store_config')
        .insert([payload]);
    }

    if (result.error) throw result.error;
    res.json({ success: true, message: 'Configura‡Æo salva' });
  } catch (err) {
    console.error('Erro salvar config:', err);
    res.status(500).json({ error: 'Erro ao salvar configura‡äes' });
  }
});

module.exports = router;
