const express = require('express');
const supabase = require('../lib/supabase');
const authenticateAdmin = require('../middleware/authenticateAdmin');

const router = express.Router();

router.get('/sync-logs', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('store_id', req.storeId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ logs: data });
  } catch (err) {
    console.error('Erro buscar logs:', err);
    res.status(500).json({ error: 'Erro ao buscar logs' });
  }
});

module.exports = router;
