<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getCatalogProducts } from '@/api/apiService';
import { Search, ChevronRight, PackagePlus } from 'lucide-vue-next';

const router = useRouter();
const products = ref([]);
const loading = ref(true);
const searchQuery = ref('');

const fetchProducts = async () => {
    loading.value = true;
    try {
        products.value = await getCatalogProducts();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

// Filtra produtos e prioriza os que NÃO têm regras (status != ativo)
const filteredProducts = computed(() => {
    let list = products.value;
    
    // Busca
    if (searchQuery.value) {
        const term = searchQuery.value.toLowerCase();
        list = list.filter(p => p.nome_regra.toLowerCase().includes(term) || p.produto_id.includes(term));
    }
    
    return list;
});

const startConfig = (id) => {
    router.push({ name: 'rules', params: { produtoId: id } });
};

onMounted(fetchProducts);
</script>

<template>
  <div class="page-container">
    <div class="page-header animate-up">
      <h1>Nova Regra</h1>
      <p>Selecione um produto abaixo para criar uma tabela de medidas.</p>
    </div>

    <div class="search-section animate-up">
        <div class="input-wrapper">
            <Search class="icon" :size="20"/>
            <input v-model="searchQuery" placeholder="Buscar produto por nome ou SKU..." autofocus />
        </div>
    </div>

    <div class="list-container animate-up" style="animation-delay: 0.1s">
        <div v-if="loading" class="state-msg">Carregando catálogo...</div>
        
        <div v-else-if="filteredProducts.length === 0" class="state-msg">
            Nenhum produto encontrado. Verifique sua sincronização XML.
        </div>

        <div v-else class="product-grid">
            <div v-for="product in filteredProducts" :key="product.id" class="product-card" @click="startConfig(product.produto_id)">
                <div class="p-icon"><PackagePlus :size="24"/></div>
                <div class="p-info">
                    <span class="p-name">{{ product.nome_regra }}</span>
                    <span class="p-sku">SKU: {{ product.produto_id }}</span>
                </div>
                <div class="p-action">
                    <span class="btn-fake">Configurar</span>
                    <ChevronRight :size="20" />
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { max-width: 800px; margin: 0 auto; }
.page-header { text-align: center; margin-bottom: 30px; }
.page-header h1 { font-size: 1.8rem; color: #1e293b; margin-bottom: 8px; }
.page-header p { color: #64748b; }

.search-section { margin-bottom: 24px; }
.input-wrapper {
    position: relative;
    max-width: 500px; margin: 0 auto;
}
.input-wrapper input {
    width: 100%; padding: 14px 14px 14px 48px; border-radius: 50px; border: 1px solid #cbd5e1;
    font-size: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: all 0.2s;
}
.input-wrapper input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
.input-wrapper .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }

.product-grid { display: flex; flex-direction: column; gap: 12px; }
.product-card {
    background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0;
    display: flex; align-items: center; gap: 16px; cursor: pointer; transition: all 0.2s;
}
.product-card:hover { border-color: var(--color-primary); transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

.p-icon { width: 48px; height: 48px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; }
.p-info { flex: 1; }
.p-name { display: block; font-weight: 600; color: #334155; margin-bottom: 2px; }
.p-sku { font-size: 0.8rem; color: #94a3b8; font-family: monospace; }

.p-action { display: flex; align-items: center; gap: 10px; color: #cbd5e1; }
.btn-fake { font-size: 0.85rem; font-weight: 600; color: var(--color-primary); }

.state-msg { text-align: center; color: #94a3b8; padding: 40px; }
.animate-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>