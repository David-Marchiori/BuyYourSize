// src/api/apiService.js

import axios from 'axios';

// Lê as chaves do arquivo .env (graças ao Vite)
const API_URL = import.meta.env.VITE_API_URL;


// Cria uma instância do Axios para a API de Backend
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// INTERCEPTOR: Injeta o token do usuário logado antes de cada requisição
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();

  if (data?.session?.access_token) {
    // Manda o token do usuário real
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  } else {
    // Fallback: Se não tiver logado (ex: login page), usa a chave pública ou admin se necessário
    // config.headers['X-API-Key'] = import.meta.env.VITE_ADMIN_API_KEY; 
  }
  return config;
});
// --- PRODUTOS ---

/**
 * GET /api/produtos
 */
export const getCatalogProducts = async (page = 1, search = '') => {
  try {
    // Passa os parâmetros na URL (ex: /produtos?page=1&limit=50&q=camiseta)
    const response = await apiClient.get('/produtos', {
      params: {
        page: page,
        limit: 50,
        q: search
      }
    });
    return response.data; // Agora retorna { produtos: [], total: 100, ... }
  } catch (error) {
    console.error('Erro ao buscar catálogo:', error);
    throw error;
  }
};

/**
 * POST /api/produtos/sync-xml
 */
export const syncCatalog = async (xmlUrl) => {
  try {
    const response = await apiClient.post('/produtos/sync-xml', { xmlUrl });
    return response.data;
  } catch (error) {
    console.error('Erro ao sincronizar catálogo:', error.response || error);
    throw error;
  }
};

// --- REGRAS ---

export const getProductRules = async (produtoId) => {
  try {
    const response = await apiClient.get('/regras', {
      params: { produto_id: produtoId }
    });
    return response.data.regras;
  } catch (error) {
    console.error('Erro ao buscar regras:', error.response || error);
    throw error;
  }
};

/**
 * Cria ou atualiza uma regra.
 */
export const saveRule = async (ruleData) => {
  try {
    if (ruleData.id) {
      // PUT /api/regras/:id
      const { id, ...payload } = ruleData;
      const response = await apiClient.put(`/regras/${id}`, payload);
      return response.data;
    } else {
      // POST /api/regras
      const response = await apiClient.post('/regras', ruleData);
      return response.data;
    }
  } catch (error) {
    console.error('Erro ao salvar regra:', error.response || error);
    throw error;
  }
};

/**
 * DELETE /api/regras/:id
 */
export const deleteRule = async (ruleId) => {
  try {
    const response = await apiClient.delete(`/regras/${ruleId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir regra:', error.response || error);
    throw error;
  }
};

// --- CONFIGURAÇÕES DA LOJA E LOGS ---
// (Estas funções agora chamam a API, não o Supabase direto)

/**
 * GET /api/store-config
 * Retorna: { xml_url: '...', update_frequency: 24 }
 */
export const getStoreSettings = async () => {
  try {
    const response = await apiClient.get('/store-config');
    return response.data; // A API deve retornar o objeto de config
  } catch (error) {
    // Se der 404 (ainda não configurado), retorna padrão
    if (error.response && error.response.status === 404) {
      return { xml_url: '', update_frequency: 24 };
    }
    console.error('Erro ao buscar config da loja:', error);
    throw error;
  }
};

/**
 * POST /api/store-config
 * Body: { xml_url: '...', update_frequency: 24 }
 */
export const saveStoreSettings = async (settings) => {
  try {
    const response = await apiClient.post('/store-config', settings);
    return response.data;
  } catch (error) {
    console.error('Erro ao salvar config da loja:', error);
    throw error;
  }
};

/**
 * GET /api/sync-logs
 * Busca histórico de logs
 */
export const getSyncHistory = async () => {
  try {
    const response = await apiClient.get('/sync-logs');
    return response.data.logs; // Espera { logs: [] }
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    throw error;
  }
};

// Função auxiliar para compatibilidade (pega o último log da lista)
export const getLastSyncLog = async () => {
  try {
    const logs = await getSyncHistory();
    return logs && logs.length > 0 ? logs[0] : null;
  } catch (error) {
    return null;
  }
};

/**
 * GET /api/regras/stats
 * Retorna objeto com contagem de regras por ID de produto: { "uuid-1": 2, "uuid-2": 1 }
 */
export const getConfiguredRuleStats = async () => {
  try {
    const response = await apiClient.get('/regras/stats');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas de regras:', error);
    // Retorna objeto vazio em caso de erro para não quebrar a tela
    return {};
  }
};

// Lista todas as modelagens cadastradas
export const getModelings = async () => {
  try {
    const response = await apiClient.get('/modelagens');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar modelagens:', error);
    throw error;
  }
};

// Busca detalhes de uma modelagem específica (pelo ID)
// CORRIGIDO: Agora chama a API, não o Supabase direto
export const getModelingDetails = async (id) => {
  try {
    const response = await apiClient.get(`/modelagens/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar detalhes da modelagem:', error);
    throw error;
  }
};

// Cria uma nova modelagem
export const createModeling = async (nome) => {
  try {
    const response = await apiClient.post('/modelagens', { nome });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar modelagem:', error);
    throw error;
  }
};

// Vincula um produto a uma modelagem
export const linkProductToModeling = async (productId, modelingId) => {
  try {
    const response = await apiClient.put(`/produtos/${productId}/vincular`, {
      modelagem_id: modelingId
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao vincular produto:', error);
    throw error;
  }
};

// Busca regras de uma MODELAGEM específica
export const getModelingRules = async (modelingId) => {
  try {
    const response = await apiClient.get('/regras', {
      params: { modelagem_id: modelingId }
    });
    return response.data.regras;
  } catch (error) {
    console.error('Erro ao buscar regras da modelagem:', error);
    throw error;
  }
};

// Vincula múltiplos produtos a uma modelagem de uma vez
export const linkProductsBatch = async (productIds, modelingId) => {
  try {
    const response = await apiClient.post('/produtos/vincular-mass', {
      product_ids: productIds,
      modelagem_id: modelingId
    });
    return response.data;
  } catch (error) {
    console.error('Erro no vínculo em massa:', error);
    throw error;
  }
};

// Desvincula múltiplos produtos (remove a modelagem deles)
export const unlinkProductsBatch = async (productIds) => {
  try {
    const response = await apiClient.post('/produtos/desvincular-mass', {
      product_ids: productIds
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao desvincular produtos:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar stats do dashboard:', error);
    throw error;
  }
};

export const getProductsByModeling = async (modelingId) => {
  try {
    // Chama a rota de produtos filtrando pelo ID da modelagem
    const response = await apiClient.get('/produtos', {
      params: { modelagem_id: modelingId }
    });
    return response.data.produtos; // Retorna a lista direta
  } catch (error) {
    console.error('Erro ao buscar produtos da modelagem:', error);
    throw error;
  }
};

export default apiClient;