const axios = require('axios');
const xml2js = require('xml2js');
const supabase = require('../lib/supabaseClient');
const AppError = require('../errors/AppError');
const { assertModelingOwnedByStore } = require('./modelings.service');

const logSync = async (storeId, status, details) => {
  await supabase.from('sync_logs').insert([{ store_id: storeId, status, details }]);
};

const syncFromXmlFeed = async (xmlUrl, storeId) => {
  if (!xmlUrl) {
    throw new AppError(400, 'A URL do feed XML é obrigatória.');
  }

  try {
    const xmlResponse = await axios.get(xmlUrl);
    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const result = await parser.parseStringPromise(xmlResponse.data);

    const itemsPath = result.rss?.channel?.item || result.feed?.entry || [];
    const itemsArray = Array.isArray(itemsPath) ? itemsPath : [itemsPath];

    const produtosParaSincronizar = itemsArray
      .map((item) => ({
        produto_id: item['g:id'] || item.link || null,
        nome_regra: item['g:title'] || 'Produto sem nome',
        store_id: storeId,
        campos_necessarios: {},
        status: 'ativo'
      }))
      .filter((p) => p.produto_id !== null);

    if (produtosParaSincronizar.length === 0) {
      throw new Error('Nenhum produto encontrado no XML.');
    }

    const { error: dbError, data: dbData } = await supabase
      .from('produtos_tamanhos')
      .upsert(produtosParaSincronizar, { onConflict: 'store_id,produto_id' })
      .select();

    if (dbError) throw dbError;

    const syncedCount = dbData ? dbData.length : 0;
    await logSync(storeId, 'success', `${syncedCount} produtos processados.`);

    return { syncedCount };
  } catch (error) {
    await logSync(storeId, 'error', `Falha: ${error.message || 'Erro desconhecido'}`);
    throw new AppError(500, 'Erro ao processar XML.', error.message);
  }
};

const listProducts = async ({ storeId, page = 1, limit = 50, q = '', modelagemId }) => {
  let query = supabase
    .from('produtos_tamanhos')
    .select('produto_id, nome_regra, status, id, modelagem_id', { count: 'exact' })
    .eq('store_id', storeId);

  if (q) {
    query = query.or(`nome_regra.ilike.%${q}%,produto_id.ilike.%${q}%`);
  }

  if (modelagemId) {
    query = query.eq('modelagem_id', modelagemId);
  } else {
    const from = (page - 1) * limit;
    const to = from + parseInt(limit, 10) - 1;
    query = query.range(from, to);
  }

  const { data, count, error } = await query.order('nome_regra', { ascending: true });
  if (error) throw error;

  return { produtos: data, total: count };
};

const linkProduct = async ({ storeId, productId, modelagemId }) => {
  if (modelagemId) {
    await assertModelingOwnedByStore(modelagemId, storeId, 'id');
  }

  const { error, data } = await supabase
    .from('produtos_tamanhos')
    .update({ modelagem_id: modelagemId })
    .eq('id', productId)
    .eq('store_id', storeId)
    .select();

  if (error) throw error;
  if (!data || !data.length) throw new AppError(404, 'Produto não encontrado.');
};

const linkProductsBatch = async ({ storeId, productIds, modelagemId }) => {
  await assertModelingOwnedByStore(modelagemId, storeId, 'id');

  const { error } = await supabase
    .from('produtos_tamanhos')
    .update({ modelagem_id: modelagemId })
    .in('id', productIds)
    .eq('store_id', storeId);

  if (error) throw error;
};

const unlinkProductsBatch = async ({ storeId, productIds }) => {
  const { error } = await supabase
    .from('produtos_tamanhos')
    .update({ modelagem_id: null })
    .in('id', productIds)
    .eq('store_id', storeId);

  if (error) throw error;
};

module.exports = {
  syncFromXmlFeed,
  listProducts,
  linkProduct,
  linkProductsBatch,
  unlinkProductsBatch
};
