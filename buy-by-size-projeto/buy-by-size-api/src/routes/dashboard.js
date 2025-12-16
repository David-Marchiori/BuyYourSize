const express = require('express');
const supabase = require('../lib/supabase');
const authenticateAdmin = require('../middleware/authenticateAdmin');

const router = express.Router();

router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const { count: total, error: errTotal } = await supabase
      .from('produtos_tamanhos')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', req.storeId);

    if (errTotal) throw errTotal;

    const { count: configured, error: errConfig } = await supabase
      .from('produtos_tamanhos')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', req.storeId)
      .not('modelagem_id', 'is', null);

    if (errConfig) throw errConfig;

    const { data: attentionList, error: errAtt } = await supabase
      .from('produtos_tamanhos')
      .select('id, produto_id, nome_regra')
      .eq('store_id', req.storeId)
      .is('modelagem_id', null)
      .limit(5);

    if (errAtt) throw errAtt;

    res.json({
      kpis: {
        total: total || 0,
        configured: configured || 0,
        missing: (total || 0) - (configured || 0)
      },
      attention: attentionList || []
    });
  } catch (err) {
    console.error('Erro dashboard stats:', err);
    res.status(500).json({ error: 'Erro ao calcular estat¡sticas.' });
  }
});

module.exports = router;
