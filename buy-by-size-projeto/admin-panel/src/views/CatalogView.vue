<script setup>
import { ref, onMounted } from 'vue';
import { getCatalogProducts, syncCatalog } from '@/api/apiService';

const products = ref([]);
const loading = ref(true);
const syncUrl = ref('https://village23.com.br/wp-content/uploads/feed/facebook/xml/feedpadrao.xml');
const syncLoading = ref(false);
const syncMessage = ref('');
const errorMessage = ref('');

// Função para buscar a lista de produtos
const fetchProducts = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    products.value = await getCatalogProducts();
  } catch (err) {
    errorMessage.value = 'Falha ao carregar o catálogo. Verifique a API Key e o Backend.';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// Função para sincronizar o catálogo
const handleSyncCatalog = async () => {
  if (!syncUrl.value) {
    syncMessage.value = 'URL do XML é obrigatória.';
    return;
  }
  
  syncLoading.value = true;
  syncMessage.value = '';
  errorMessage.value = '';

  try {
    const result = await syncCatalog(syncUrl.value);
    syncMessage.value = result.message || 'Sincronização iniciada com sucesso!';
    // Após sincronizar, atualiza a lista de produtos
    await fetchProducts(); 
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Erro desconhecido na sincronização.';
  } finally {
    syncLoading.value = false;
  }
};

// Carrega os produtos assim que o componente for montado
onMounted(fetchProducts);
</script>

<template>
  <div class="catalog-view">
    <h2>Catálogo de Produtos ({{ products.length }})</h2>
    
    <div class="sync-panel">
      <h3>Sincronizar Catálogo XML</h3>
      <input type="url" v-model="syncUrl" placeholder="URL do Feed XML" :disabled="syncLoading">
      <button @click="handleSyncCatalog" :disabled="syncLoading">
        {{ syncLoading ? 'Sincronizando...' : 'Sincronizar Agora' }}
      </button>
      <p v-if="syncMessage" class="message-success">{{ syncMessage }}</p>
      <p v-if="errorMessage" class="message-error">{{ errorMessage }}</p>
    </div>

    <hr>

    <div v-if="loading">Carregando produtos...</div>
    <div v-else-if="products.length === 0">Nenhum produto encontrado no catálogo. Sincronize o XML acima.</div>
    <table v-else class="products-table">
      <thead>
        <tr>
          <th>ID Produto</th>
          <th>Nome</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.produto_id }}</td>
          <td>{{ product.nome_regra }}</td>
          <td>{{ product.status }}</td>
          <td>
            <button @click="$router.push({ name: 'rules', params: { produtoId: product.produto_id } })">
                Gerenciar Regras
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Adicione estilos básicos para legibilidade */
.sync-panel { margin-bottom: 20px; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
.sync-panel input { padding: 8px; margin-right: 10px; width: 400px; }
.products-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.products-table th, .products-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
.message-success { color: green; font-weight: bold; }
.message-error { color: red; font-weight: bold; }
</style>