const supabase = require('../lib/supabaseClient');

const getStats = async (storeId) => {
  const { count: total, error: errTotal } = await supabase
    .from('produtos_tamanhos')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  if (errTotal) throw errTotal;

  const { count: configured, error: errConfig } = await supabase
    .from('produtos_tamanhos')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .not('modelagem_id', 'is', null);

  if (errConfig) throw errConfig;

  const { data: attentionList, error: errAtt } = await supabase
    .from('produtos_tamanhos')
    .select('id, produto_id, nome_regra')
    .eq('store_id', storeId)
    .is('modelagem_id', null)
    .limit(5);

  if (errAtt) throw errAtt;

  return {
    kpis: {
      total: total || 0,
      configured: configured || 0,
      missing: (total || 0) - (configured || 0)
    },
    attention: attentionList || []
  };
};

const getKpis = async (storeId) => {
  const { count: total, error: errTotal } = await supabase
    .from('analytics_recommends')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  const { count: last24h, error: err24h } = await supabase
    .from('analytics_recommends')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .gte('created_at', ontem.toISOString());

  if (errTotal || err24h) throw new Error('Erro ao buscar KPIs');

  return {
    total_recomendacoes: total || 0,
    ultimas_24h: last24h || 0
  };
};

module.exports = { getStats, getKpis };
