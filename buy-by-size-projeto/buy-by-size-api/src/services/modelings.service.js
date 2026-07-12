const supabase = require('../lib/supabaseClient');
const AppError = require('../errors/AppError');
const { PRODUCT_TYPES } = require('../utils/rules');

const getModelingOwnedByStore = async (modelagemId, storeId, columns = 'id, tipo') => {
  const { data } = await supabase
    .from('modelagens')
    .select(columns)
    .eq('id', modelagemId)
    .eq('store_id', storeId)
    .single();

  return data || null;
};

const assertModelingOwnedByStore = async (modelagemId, storeId, columns) => {
  const modelagem = await getModelingOwnedByStore(modelagemId, storeId, columns);
  if (!modelagem) {
    throw new AppError(403, 'Modelagem inválida ou de outra loja.');
  }
  return modelagem;
};

const listModelings = async (storeId) => {
  const { data: modelagens, error } = await supabase
    .from('modelagens')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: produtos, error: produtosError } = await supabase
    .from('produtos_tamanhos')
    .select('modelagem_id')
    .eq('store_id', storeId);

  if (produtosError) throw produtosError;

  const counts = {};
  (produtos || []).forEach((p) => {
    if (p.modelagem_id) counts[p.modelagem_id] = (counts[p.modelagem_id] || 0) + 1;
  });

  return (modelagens || []).map((m) => ({
    ...m,
    total_produtos: counts[m.id] || 0
  }));
};

const createModeling = async ({ nome, tipo, storeId }) => {
  if (!PRODUCT_TYPES.includes(tipo)) {
    throw new AppError(400, `Tipo inválido. Use um destes: ${PRODUCT_TYPES.join(', ')}.`);
  }

  const { data, error } = await supabase
    .from('modelagens')
    .insert([{ nome, store_id: storeId, tipo }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const getModelingById = async (id, storeId) => {
  const modelagem = await getModelingOwnedByStore(id, storeId, '*');
  if (!modelagem) throw new AppError(404, 'Modelagem não encontrada.');
  return modelagem;
};

const listProductsByModeling = async (id, storeId) => {
  const { data, error } = await supabase
    .from('produtos_tamanhos')
    .select('*')
    .eq('modelagem_id', id)
    .eq('store_id', storeId);

  if (error) throw error;
  return data;
};

const deleteModeling = async (modelagemId, storeId) => {
  const modelagem = await getModelingOwnedByStore(modelagemId, storeId, 'id, store_id');
  if (!modelagem) throw new AppError(404, 'Modelagem não encontrada ou acesso negado.');

  const { error: unlinkError } = await supabase
    .from('produtos_tamanhos')
    .update({ modelagem_id: null })
    .eq('modelagem_id', modelagemId)
    .eq('store_id', storeId);

  if (unlinkError) throw unlinkError;

  const { error: rulesError } = await supabase
    .from('regras_detalhes')
    .delete()
    .eq('modelagem_id', modelagemId);

  if (rulesError) throw rulesError;

  const { error: deleteError } = await supabase.from('modelagens').delete().eq('id', modelagemId);
  if (deleteError) throw deleteError;
};

module.exports = {
  getModelingOwnedByStore,
  assertModelingOwnedByStore,
  listModelings,
  createModeling,
  getModelingById,
  listProductsByModeling,
  deleteModeling
};
