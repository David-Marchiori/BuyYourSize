<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getCatalogProducts, syncCatalog, getStoreSettings, getModelings, linkProductsBatch } from '@/api/apiService';
import { 
  Search, RefreshCw, DownloadCloud, Filter, 
  ArrowRight, Package, AlertCircle, CheckCircle2, X, Layers, Link2,
  ChevronLeft, ChevronRight as ChevronIcon
} from 'lucide-vue-next';

const router = useRouter();

// --- ESTADOS DE DADOS ---
const products = ref([]);
const modelings = ref([]);
const loading = ref(true);

// --- ESTADOS DE PAGINAÇÃO E BUSCA ---
const searchQuery = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const itemsPerPage = 50;
let searchTimeout = null; // Para o debounce

// --- ESTADOS DE SELEÇÃO E AÇÃO ---
const selectedItems = ref([]);
const showLinkModal = ref(false);
const selectedModelingId = ref('');
const linking = ref(false);

// --- ESTADOS DE SYNC ---
const showSyncModal = ref(false);
const syncUrl = ref('');
const syncLoading = ref(false);
const syncMessage = ref('');
const errorMessage = ref('');

// --- LÓGICA PRINCIPAL ---

const fetchData = async () => {
  loading.value = true;
  try {
    // 1. Busca Modelagens (para o select do modal)
    // Se já tiver carregado modelagens antes, não precisa carregar de novo toda vez
    if (modelings.value.length === 0) {
        modelings.value = await getModelings() || [];
    }

    // 2. Busca Produtos (Com paginação e busca)
    // A API agora retorna { produtos: [], total: 100, totalPages: 5, ... }
    const data = await getCatalogProducts(currentPage.value, searchQuery.value);
    
    products.value = data.produtos || [];
    totalItems.value = data.total || 0;
    totalPages.value = data.totalPages || 1;

  } catch (err) {
    console.error(err);
    errorMessage.value = 'Falha ao carregar dados.';
  } finally {
    loading.value = false;
  }
};

// --- OBSERVADORES (WATCHERS) ---

// 1. Monitora a busca para filtrar no servidor
watch(searchQuery, (newVal) => {
    // Debounce: Espera o usuário parar de digitar por 500ms
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1; // Reseta para primeira página
        fetchData();
    }, 500);
});

// 2. Monitora a página para navegar
watch(currentPage, () => {
    fetchData();
    // Opcional: Rolar para o topo da tabela
    // window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- PAGINAÇÃO ---
const nextPage = () => {
    if (currentPage.value < totalPages.value) currentPage.value++;
};
const prevPage = () => {
    if (currentPage.value > 1) currentPage.value--;
};

// --- SELEÇÃO ---
const toggleSelection = (id) => {
    if (selectedItems.value.includes(id)) {
        selectedItems.value = selectedItems.value.filter(item => item !== id);
    } else {
        selectedItems.value.push(id);
    }
};

const toggleAll = () => {
    // Verifica se todos da PÁGINA ATUAL estão selecionados
    const allOnPageSelected = products.value.every(p => selectedItems.value.includes(p.id));
    
    if (allOnPageSelected) {
        // Desmarca todos da página atual
        const idsOnPage = products.value.map(p => p.id);
        selectedItems.value = selectedItems.value.filter(id => !idsOnPage.includes(id));
    } else {
        // Marca todos da página atual (adiciona sem duplicar)
        const newIds = products.value.map(p => p.id);
        selectedItems.value = [...new Set([...selectedItems.value, ...newIds])];
    }
};

// --- AÇÕES EM MASSA (VÍNCULO) ---
const openLinkModal = () => {
    if (selectedItems.value.length === 0) return;
    selectedModelingId.value = '';
    showLinkModal.value = true;
};

const handleBulkLink = async () => {
    if (!selectedModelingId.value) return alert('Selecione uma modelagem.');
    linking.value = true;
    try {
        await linkProductsBatch(selectedItems.value, selectedModelingId.value);
        alert('Produtos vinculados com sucesso!');
        showLinkModal.value = false;
        selectedItems.value = [];
        await fetchData(); // Recarrega para ver os badges atualizados
    } catch (err) {
        alert('Erro ao vincular.');
    } finally {
        linking.value = false;
    }
};

// --- SYNC XML ---
const openSyncModal = async () => {
    try {
        const settings = await getStoreSettings();
        if (settings?.xml_url) { syncUrl.value = settings.xml_url; showSyncModal.value = true; }
        else if(confirm('Configurar XML?')) router.push({ name: 'XmlIntegration' });
    } catch (e) { showSyncModal.value = true; }
};

const handleSyncCatalog = async () => {
    syncLoading.value = true;
    try {
        await syncCatalog(syncUrl.value);
        currentPage.value = 1; // Volta pro inicio após sync
        await fetchData();
        showSyncModal.value = false;
    } catch(e) { errorMessage.value = 'Erro sync'; }
    finally { syncLoading.value = false; }
};

onMounted(fetchData);
</script>

<template>
  <div class="page-container">
    
    <div class="page-header animate-up">
      <div>
        <h1>Catálogo de Produtos</h1>
        <p>Gerencie produtos e vincule-os às suas Modelagens.</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="openSyncModal">
          <DownloadCloud :size="18" /> Sincronizar XML
        </button>
      </div>
    </div>

    <div class="table-controls animate-up" style="animation-delay: 0.1s">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input v-model="searchQuery" type="text" placeholder="Buscar por nome ou SKU..." />
      </div>
      
      <transition name="fade">
          <div v-if="selectedItems.length > 0" class="bulk-actions">
              <span class="selected-count">{{ selectedItems.length }} selecionados</span>
              <button class="btn-bulk" @click="openLinkModal">
                  <Link2 :size="16" /> Vincular a Modelagem
              </button>
          </div>
      </transition>
    </div>

    <div class="table-card animate-up" style="animation-delay: 0.2s">
      
      <div v-if="loading" class="loading-state">
          <RefreshCw :size="32" class="spin"/> 
          <p>Carregando...</p>
      </div>

      <div v-else-if="products.length === 0" class="empty-state">
          <Package :size="48" class="text-gray" />
          <h3>Nenhum produto encontrado</h3>
          <p v-if="searchQuery">Sem resultados para "{{ searchQuery }}"</p>
          <p v-else>Sincronize seu XML para começar.</p>
      </div>

      <div v-else>
          <table class="modern-table">
            <thead>
              <tr>
                <th width="5%">
                    <input type="checkbox" 
                        :checked="products.length > 0 && products.every(p => selectedItems.includes(p.id))"
                        @change="toggleAll"
                    >
                </th>
                <th width="40%">Produto</th>
                <th width="20%">SKU</th>
                <th width="20%">Modelagem</th>
                <th width="15%" class="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product.id" class="table-row" :class="{'row-selected': selectedItems.includes(product.id)}">
                <td>
                    <input type="checkbox" 
                        :checked="selectedItems.includes(product.id)"
                        @change="toggleSelection(product.id)"
                    >
                </td>
                <td>
                  <div class="product-info">
                    <div class="product-icon"><Package :size="20" /></div>
                    <span class="product-name">{{ product.nome_regra }}</span>
                  </div>
                </td>
                <td class="text-code">{{ product.produto_id }}</td>
                <td>
                  <span v-if="product.modelagem_id" class="badge-modeling">
                      <Layers :size="12"/> Configurado
                  </span>
                  <span v-else class="badge-empty">Sem vínculo</span>
                </td>
                <td class="text-right">
                    <button v-if="product.modelagem_id" class="btn-icon-action" title="Editar Modelagem" @click="router.push({name: 'modeling-rules', params: {id: product.modelagem_id}})">
                        <ArrowRight :size="16" />
                    </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination-footer">
              <span class="page-info">
                  Mostrando <strong>{{ products.length }}</strong> de <strong>{{ totalItems }}</strong> resultados
              </span>
              <div class="page-controls">
                  <button class="btn-page" :disabled="currentPage === 1" @click="prevPage">
                      <ChevronLeft :size="18" />
                  </button>
                  <span class="current-page">Página {{ currentPage }} de {{ totalPages }}</span>
                  <button class="btn-page" :disabled="currentPage === totalPages" @click="nextPage">
                      <ChevronIcon :size="18" />
                  </button>
              </div>
          </div>
      </div>
    </div>

    <div v-if="showLinkModal" class="modal-overlay" @click.self="showLinkModal = false">
        <div class="modal-card animate-scale">
            <h3>Vincular Produtos</h3>
            <p>Vincular <strong>{{ selectedItems.length }}</strong> produtos à modelagem:</p>
            <div class="select-group">
                <select v-model="selectedModelingId">
                    <option value="" disabled>Selecione...</option>
                    <option v-for="mod in modelings" :key="mod.id" :value="mod.id">{{ mod.nome }}</option>
                </select>
            </div>
            <div class="modal-actions">
                <button class="btn-text" @click="showLinkModal = false">Cancelar</button>
                <button class="btn-primary" @click="handleBulkLink" :disabled="linking || !selectedModelingId">
                    {{ linking ? 'Salvando...' : 'Salvar' }}
                </button>
            </div>
        </div>
    </div>

    <div v-if="showSyncModal" class="sync-overlay">
        <div class="sync-card"><div class="sync-body"><h3>Sincronizando...</h3></div></div>
    </div>

  </div>
</template>

<style scoped>
/* ESTILOS DE PAGINAÇÃO (Novos) */
.pagination-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #fcfcfc;
}
.page-info { font-size: 0.85rem; color: #64748b; }
.page-info strong { color: #334155; }
.page-controls { display: flex; align-items: center; gap: 12px; }
.btn-page {
    background: white; border: 1px solid #cbd5e1; border-radius: 6px; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: 0.2s;
}
.btn-page:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.btn-page:disabled { opacity: 0.5; cursor: not-allowed; background: #f1f5f9; }
.current-page { font-size: 0.85rem; font-weight: 600; color: #334155; }

/* REUTILIZAÇÃO DE ESTILOS (Mesmos do arquivo anterior) */
.bulk-actions { display: flex; align-items: center; gap: 12px; background: #1e293b; color: white; padding: 8px 16px; border-radius: 8px; animation: slideIn 0.2s ease-out; }
.selected-count { font-size: 0.9rem; font-weight: 600; border-right: 1px solid #475569; padding-right: 12px; }
.btn-bulk { background: transparent; border: none; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; }
.row-selected { background-color: #f0f9ff !important; }
.badge-modeling { display: inline-flex; align-items: center; gap: 4px; background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
.badge-empty { color: #94a3b8; font-size: 0.8rem; font-style: italic; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
.modal-card { background: white; padding: 24px; border-radius: 16px; width: 100%; max-width: 450px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.select-group { margin: 20px 0; }
.select-group select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; background: white; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-text { background: none; border: none; color: #64748b; font-weight: 600; cursor: pointer; }
.page-container { max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.page-header h1 { font-size: 1.75rem; color: #1e293b; margin-bottom: 4px; }
.btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 8px; cursor: pointer; display: flex; gap: 8px; align-items: center; font-weight: 600; color: #475569; }
.btn-primary { background: var(--color-primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; height: 60px; }
.search-box { position: relative; width: 300px; }
.search-box input { width: 100%; padding: 8px 8px 8px 36px; border: 1px solid #e2e8f0; border-radius: 8px; }
.search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 16px; background: #f8fafc; color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
.modern-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.product-info { display: flex; align-items: center; gap: 12px; }
.product-icon { width: 32px; height: 32px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
.product-name { font-weight: 600; color: #334155; }
.text-code { font-family: monospace; color: #64748b; font-size: 0.85rem; }
.text-right { text-align: right; }
.btn-icon-action { background: white; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
.btn-icon-action:hover { color: var(--color-primary); border-color: var(--color-primary); }
.loading-state, .empty-state { text-align: center; padding: 40px; color: #64748b; }
.text-gray { color: #cbd5e1; margin-bottom: 10px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.animate-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-card.animate-scale { animation: scaleIn 0.2s ease-out forwards; }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>