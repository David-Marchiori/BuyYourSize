// src/api/apiService.js

import axios from 'axios';

// Lê as chaves do arquivo .env (graças ao Vite)
const API_URL = import.meta.env.VITE_API_URL;
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

// Cria uma instância do Axios para a API de Backend, incluindo o cabeçalho de segurança
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // O header de segurança é obrigatório para as rotas administrativas
    'X-API-Key': ADMIN_API_KEY
  }
});

/**
 * Chama a rota para listar todos os produtos importados do catálogo.
 * GET /api/produtos
 */
export const getCatalogProducts = async () => {
  try {
    const response = await apiClient.get('/produtos');
    return response.data.produtos;
  } catch (error) {
    console.error('Erro ao buscar catálogo de produtos:', error.response || error);
    throw error;
  }
};

/**
 * Chama a rota para sincronizar o catálogo via URL XML.
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
 * Cria ou atualiza uma regra de sugestão.
 * Se 'id' for passado, usa PUT /api/regras/:id
 * Se 'id' for nulo, usa POST /api/regras
 */
export const saveRule = async (ruleData) => {
  try {
    if (ruleData.id) {
      // ATUALIZAR (PUT)
      const { id, ...payload } = ruleData;
      const response = await apiClient.put(`/regras/${id}`, payload);
      return response.data;
    } else {
      // CRIAR (POST)
      const response = await apiClient.post('/regras', ruleData);
      return response.data;
    }
  } catch (error) {
    console.error('Erro ao salvar regra:', error.response || error);
    throw error;
  }
};

/**
 * Exclui uma regra de sugestão.
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

export default apiClient;