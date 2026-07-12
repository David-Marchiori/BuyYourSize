const supabase = require('../lib/supabaseClient');
const AppError = require('../errors/AppError');
const { evaluateCondition, parsePhraseList, getFieldConfig, getMissingEssentialFields } = require('../utils/rules');

const getProductWithModeling = async (produtoId, storeId) => {
  const { data, error } = await supabase
    .from('produtos_tamanhos')
    .select('modelagem_id, modelagens(tipo)')
    .eq('produto_id', produtoId)
    .eq('store_id', storeId)
    .single();

  if (error || !data) return null;
  return data;
};

// Pontua uma regra: condições em campos essenciais são obrigatórias (regra é
// descartada se alguma falhar); condições em campos opcionais só somam ao score
// quando o cliente informou aquela medida — se não informou, a condição é
// ignorada (não bloqueia nem penaliza), permitindo recomendar mesmo com dados parciais.
const scoreRule = (regra, medidas, essenciais) => {
  let opcionaisAtendidas = 0;

  for (const condicao of regra.condicoes || []) {
    const medidaCliente = medidas[condicao.campo];
    const informado = medidaCliente !== undefined && medidaCliente !== null && medidaCliente !== '';
    const isEssencial = essenciais.includes(condicao.campo);

    if (!informado) {
      if (isEssencial) return null; // essencial ausente: regra não pode ser avaliada
      continue; // opcional ausente: ignora, não penaliza
    }

    const bateu = evaluateCondition(
      parseFloat(medidaCliente),
      condicao.operador,
      parseFloat(condicao.valor)
    );

    if (!bateu) return null; // qualquer condição informada que falhe descarta a regra
    if (!isEssencial) opcionaisAtendidas += 1;
  }

  return opcionaisAtendidas;
};

const findSuggestion = (regras, tipoTabela, medidas) => {
  if (tipoTabela === 'calcado') {
    const peCliente = parseFloat(medidas.pe);
    if (!peCliente) return { invalid: true };

    const regra = regras.find(
      (r) => peCliente >= parseFloat(r.pe_min) && peCliente <= parseFloat(r.pe_max)
    );

    return regra
      ? { tamanho: regra.sugestao_tamanho, phrases: parsePhraseList(regra.frase_sugestao), score: 0 }
      : null;
  }

  const config = getFieldConfig(tipoTabela);
  const essenciais = config ? config.essenciais : [];

  // Regras já vêm ordenadas por prioridade (desc); entre regras de mesma
  // prioridade, prefere a de maior score de campos opcionais atendidos.
  let melhor = null;
  let melhorScore = -1;

  for (const regra of regras) {
    const score = scoreRule(regra, medidas, essenciais);
    if (score === null) continue;

    if (
      !melhor ||
      regra.prioridade > melhor.prioridade ||
      (regra.prioridade === melhor.prioridade && score > melhorScore)
    ) {
      melhor = regra;
      melhorScore = score;
    }
  }

  return melhor
    ? { tamanho: melhor.sugestao_tamanho, phrases: parsePhraseList(melhor.frase_sugestao), score: melhorScore }
    : null;
};

const registerRecommendation = (storeId, produtoId, sugestaoTamanho, tipoTabela) => {
  supabase
    .from('analytics_recommends')
    .insert([
      {
        store_id: storeId,
        product_id: produtoId,
        sugestao: sugestaoTamanho,
        tipo_tabela: tipoTabela,
        created_at: new Date()
      }
    ])
    .then(({ error }) => {
      if (error) console.error('Erro silencioso Analytics:', error);
    });
};

const getSuggestion = async ({ produtoId, medidas, storeId }) => {
  const produto = await getProductWithModeling(produtoId, storeId);
  if (!produto) throw new AppError(404, 'Produto não encontrado.');

  if (!produto.modelagem_id) {
    return { sugestao: null, message: 'Sem tabela vinculada.' };
  }

  const tipoTabela = produto.modelagens?.tipo;

  const faltando = getMissingEssentialFields(tipoTabela, medidas);
  if (faltando.length) {
    throw new AppError(400, `Faltam medidas obrigatórias: ${faltando.join(', ')}.`);
  }

  const { data: regras, error } = await supabase
    .from('regras_detalhes')
    .select('*')
    .eq('modelagem_id', produto.modelagem_id)
    .order('prioridade', { ascending: false });

  if (error) throw error;

  if (!regras || !regras.length) {
    return { sugestao: null, message: 'Tabela vazia.' };
  }

  const found = findSuggestion(regras, tipoTabela, medidas);

  if (found?.invalid) {
    return { sugestao: null, message: 'Medida do pé inválida.' };
  }

  if (!found) {
    return { sugestao: null, message: 'Nenhuma regra encontrada.' };
  }

  const phrases = found.phrases || [];
  registerRecommendation(storeId, produtoId, found.tamanho, tipoTabela);

  const config = getFieldConfig(tipoTabela);
  const totalOpcionais = config ? config.opcionais.length : 0;
  const confianca = totalOpcionais > 0 && found.score > 0 ? 'alta' : 'padrao';

  return {
    sugestao: found.tamanho,
    frase: phrases[0] || null,
    frases: phrases,
    confianca,
    tipo: tipoTabela
  };
};

const checkWidgetAvailability = async (produtoId, storeId) => {
  if (!storeId) return { available: false };

  const produto = await getProductWithModeling(produtoId, storeId);
  if (!produto || !produto.modelagem_id) return { available: false };

  return { available: true, type: produto.modelagens?.tipo };
};

module.exports = { getSuggestion, checkWidgetAvailability };
