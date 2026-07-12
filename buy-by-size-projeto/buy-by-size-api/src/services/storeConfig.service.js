const supabase = require('../lib/supabaseClient');
const AppError = require('../errors/AppError');

const ALLOWED_FIELDS = ['xml_url', 'update_frequency'];

const getConfig = async (storeId) => {
  const { data, error } = await supabase
    .from('store_config')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) throw new AppError(404, 'Configuração não encontrada.');

  return data;
};

const saveConfig = async (storeId, settings) => {
  const payload = { store_id: storeId };
  ALLOWED_FIELDS.forEach((field) => {
    if (settings[field] !== undefined) payload[field] = settings[field];
  });

  const { data: existing } = await supabase
    .from('store_config')
    .select('id')
    .eq('store_id', storeId)
    .single();

  const result = existing
    ? await supabase
        .from('store_config')
        .update(payload)
        .eq('id', existing.id)
        .eq('store_id', storeId)
    : await supabase.from('store_config').insert([payload]);

  if (result.error) throw result.error;
};

module.exports = { getConfig, saveConfig };
