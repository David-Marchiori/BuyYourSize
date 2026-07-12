const supabase = require('../lib/supabaseClient');

const listRecentLogs = async (storeId, limit = 10) => {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

module.exports = { listRecentLogs };
