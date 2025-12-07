<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getCatalogProducts, syncCatalog, getStoreSettings } from '@/api/apiService'; // Adicionado getStoreSettings
import { 
  Search, RefreshCw, DownloadCloud, Filter, 
  ArrowRight, Package, AlertCircle, CheckCircle2, X
} from 'lucide-vue-next';

const router = useRouter();

// --- ESTADOS ---
const products = ref([]);
const loading = ref(true);
const searchQuery = ref('');

// Estados de Sincronização
const showSyncModal = ref(false);
const syncUrl = ref(''); // Agora começa vazio
const syncLoading = ref(false);
const syncMessage = ref('');
const errorMessage = ref('');

// --- LÓGICA ---

// Buscar produtos
const fetchProducts = async () => {
  loading.value = true;
  try {
    products.value = await getCatalogProducts();
  } catch (err) {
    console.error(err);
    errorMessage.value = 'Falha ao carregar o catálogo.';
  } finally {
    loading.value = false;
  }
};

// Abrir Modal de Sincronização (Busca URL salva)
const openSyncModal = async () => {
    syncLoading.value = true;
    syncMessage.value = '';
    errorMessage.value = '';
    
    try {
        // Busca configuração salva
        const settings = await getStoreSettings();
        
        if (settings && settings.xml_url) {
            syncUrl.value = settings.xml_url;
            showSyncModal.value = true;
        } else {
            // Se não tiver URL configurada, sugere ir para a tela de config
            if(confirm('Nenhuma URL de XML configurada. Deseja configurar agora?')) {
                router.push({ name: 'XmlIntegration' });
            }
        }
    } catch (err) {
        console.error(err);
        errorMessage.value = 'Erro ao buscar configuração do XML.';
        showSyncModal.value = true; // Abre mesmo assim (pode digitar manual se quiser)
    } finally {
        syncLoading.value = false;
    }
};

// Sincronizar XML
const handleSyncCatalog = async () => {
  if (!syncUrl.value) return;
  
  syncLoading.value = true;
  syncMessage.value = '';
  errorMessage.value = '';

  try {
    const result = await syncCatalog(syncUrl.value);
    syncMessage.value = result.message || 'Sincronização concluída!';
    await fetchProducts(); // Recarrega a lista
    setTimeout(() => { showSyncModal.value = false; syncMessage.value = ''; }, 2000); 
  } catch (err) {
    errorMessage.value = err.response?.data?.error || 'Erro na sincronização.';
  } finally {
    syncLoading.value = false;
  }
};

// Filtragem Local
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  const lowerTerm = searchQuery.value.toLowerCase();
  return products.value.filter(p => 
    (p.nome_regra && p.nome_regra.toLowerCase().includes(lowerTerm)) || 
    (p.produto_id && p.produto_id.toLowerCase().includes(lowerTerm))
  );
});

const navigateToRules = (produtoId) => {
  router.push({ name: 'rules', params: { produtoId: produtoId } });
};

onMounted(fetchProducts);
</script>

<template>
  <div class="page-container">
    
    <div class="page-header animate-up">
      <div>
        <h1>Catálogo de Produtos</h1>
        <p>Gerencie os produtos importados e configure suas regras de medida.</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openSyncModal" :disabled="syncLoading">
          <DownloadCloud :size="18" /> Sincronizar XML
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showSyncModal" class="sync-overlay" @click.self="showSyncModal = false">
        <div class="sync-card animate-scale">
          <div class="sync-header">
            <h3>Sincronizar Catálogo</h3>
            <button class="close-btn" @click="showSyncModal = false"><X :size="20" /></button>
          </div>
          <div class="sync-body">
            <label>URL do Feed XML (Carregada da Configuração)</label>
            <div class="input-wrapper">
              <input type="url" v-model="syncUrl" placeholder="Carregando..." readonly class="input-readonly">
            </div>
            
            <p class="info-text">Esta URL está definida nas <a @click="router.push({name: 'XmlIntegration'})">Integrações</a>.</p>

            <div v-if="syncMessage" class="alert success"><CheckCircle2 :size="16" /> {{ syncMessage }}</div>
            <div v-if="errorMessage" class="alert error"><AlertCircle :size="16" /> {{ errorMessage }}</div>

            <div class="sync-actions">
              <button class="btn-text" @click="showSyncModal = false">Cancelar</button>
              <button class="btn-primary" @click="handleSyncCatalog" :disabled="syncLoading">
                <RefreshCw :size="18" :class="{ 'spin': syncLoading }" />
                {{ syncLoading ? 'Sincronizando...' : 'Iniciar Importação' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div class="table-controls animate-up" style="animation-delay: 0.1s">
      <div class="search-box">
        <Search :size="18" class="search-icon" />
        <input v-model="searchQuery" type="text" placeholder="Buscar por nome ou SKU..." />
      </div>
      <div class="filter-actions">
        <button class="btn-outline"><Filter :size="16" /> Filtrar Status</button>
        <span class="count-badge">{{ filteredProducts.length }} produtos</span>
      </div>
    </div>

    <div class="table-card animate-up" style="animation-delay: 0.2s">
      
      <div v-if="loading" class="loading-state">
        <RefreshCw :size="32" class="spin text-primary" />
        <p>Carregando catálogo...</p>
      </div>

      <div v-else-if="filteredProducts.length === 0" class="empty-state">
        <Package :size="48" class="text-gray" />
        <h3>Nenhum produto encontrado</h3>
        <p>Tente ajustar a busca ou sincronize um novo XML.</p>
      </div>

      <table v-else class="modern-table">
        <thead>
          <tr>
            <th width="40%">Produto</th>
            <th width="20%">SKU / ID</th>
            <th width="15%">Status</th>
            <th width="10%">Regras</th>
            <th width="15%" class="text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in filteredProducts" :key="product.id" class="table-row">
            <td>
              <div class="product-info">
                <div class="product-icon">
                  <Package :size="20" />
                </div>
                <span class="product-name">{{ product.nome_regra }}</span>
              </div>
            </td>
            <td class="text-code">{{ product.produto_id }}</td>
            <td>
              <span class="status-badge" :class="product.status === 'ativo' ? 'active' : 'inactive'">
                {{ product.status || 'Ativo' }}
              </span>
            </td>
            <td>
              <span class="rules-check configured">Configurar</span> 
            </td>
            <td class="text-right">
              <button class="btn-icon-action" title="Configurar Regras" @click="navigateToRules(product.produto_id)">
                Configurar <ArrowRight :size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
/* CSS Mantido (Igual ao anterior) + Adição de input-readonly e link */
.input-readonly {
    background-color: #f1f5f9;
    color: #64748b;
    cursor: not-allowed;
}
.info-text {
    font-size: 0.85rem;
    color: #94a3b8;
    margin-bottom: 20px;
}
.info-text a {
    color: var(--color-primary);
    text-decoration: underline;
    cursor: pointer;
}

/* ... Resto do CSS original ... */
/* ANIMAÇÕES */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.animate-up { opacity: 0; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-scale { animation: scaleIn 0.2s ease-out forwards; }
.spin { animation: spin 1s linear infinite; }

/* LAYOUT */
.page-container { max-width: 1200px; margin: 0 auto; }

/* Header */
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.page-header h1 { font-size: 1.75rem; color: #1e293b; margin-bottom: 4px; }
.page-header p { color: #64748b; }

/* Botões */
.btn-primary { display: flex; align-items: center; gap: 8px; background: var(--color-primary); color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 123, 255, 0.2); }
.btn-primary:hover { background: #0069d9; transform: translateY(-1px); }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
.btn-outline { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; color: #64748b; padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-outline:hover { border-color: #cbd5e1; background: #f8fafc; color: #334155; }
.btn-text { background: none; border: none; color: #64748b; font-weight: 500; cursor: pointer; padding: 10px 20px; }
.btn-text:hover { color: #334155; }

/* CONTROLES DA TABELA */
.table-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; }
.search-box { position: relative; width: 350px; }
.search-box input { width: 100%; padding: 10px 10px 10px 40px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; background: #f8fafc; transition: all 0.2s; }
.search-box input:focus { background: white; border-color: var(--color-primary); outline: none; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.filter-actions { display: flex; align-items: center; gap: 12px; }
.count-badge { font-size: 0.85rem; color: #64748b; font-weight: 500; }

/* TABELA */
.table-card { background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 16px 24px; background: #f8fafc; color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
.modern-table td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.table-row:last-child td { border-bottom: none; }
.table-row:hover td { background: #f8fafc; }

/* Colunas Específicas */
.product-info { display: flex; align-items: center; gap: 12px; }
.product-icon { width: 36px; height: 36px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; }
.product-name { font-weight: 600; color: #334155; font-size: 0.95rem; }
.text-code { font-family: 'Monaco', monospace; font-size: 0.85rem; color: #64748b; }
.text-right { text-align: right; }
.status-badge { display: inline-flex; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; }
.status-badge.active { background: #dcfce7; color: #166534; }
.status-badge.inactive { background: #f1f5f9; color: #64748b; }
.btn-icon-action { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; color: #475569; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-icon-action:hover { border-color: var(--color-primary); color: var(--color-primary); background: #eff6ff; }

/* ESTADOS */
.loading-state, .empty-state { padding: 60px; text-align: center; color: #64748b; }
.text-primary { color: var(--color-primary); }
.text-gray { color: #cbd5e1; margin-bottom: 16px; }

/* MODAL DE SYNC */
.sync-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
.sync-card { background: white; width: 100%; max-width: 500px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.sync-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.sync-header h3 { font-size: 1.1rem; font-weight: 600; margin: 0; }
.close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; }
.sync-body { padding: 24px; }
.sync-body label { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 8px; color: #334155; }
.input-wrapper input { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; margin-bottom: 5px; } /* Ajuste margin-bottom */
.alert { padding: 12px; border-radius: 8px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.alert.success { background: #dcfce7; color: #166534; }
.alert.error { background: #fee2e2; color: #b91c1c; }
.sync-actions { display: flex; justify-content: flex-end; gap: 10px; }
</style>