<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getCatalogProducts, getConfiguredRuleStats } from '@/api/apiService'; // Importando a nova função
import { Ruler, Edit2, Search, CheckCircle2, Layers } from 'lucide-vue-next';

const router = useRouter();
const rulesList = ref([]);
const loading = ref(true);
const searchQuery = ref('');

const fetchMyRules = async () => {
    loading.value = true;
    try {
        // 1. Busca todos os produtos e as estatísticas de regras em paralelo
        const [allProducts, ruleStats] = await Promise.all([
            getCatalogProducts(),
            getConfiguredRuleStats()
        ]);
        
        console.log('Stats de Regras:', ruleStats); // Para debug

        // 2. Filtra produtos: Só fica quem tem ID presente no objeto ruleStats
        // E adiciona a contagem de regras ao objeto do produto
        rulesList.value = allProducts
            .filter(p => ruleStats[p.id] > 0) // Verifica se existe no mapa de stats
            .map(p => ({
                ...p,
                total_regras: ruleStats[p.id] // Adiciona a contagem para usar no template
            }));

    } catch (err) {
        console.error('Erro ao buscar minhas regras:', err);
    } finally {
        loading.value = false;
    }
};

const filteredRules = computed(() => {
    if (!searchQuery.value) return rulesList.value;
    const term = searchQuery.value.toLowerCase();
    return rulesList.value.filter(p => 
        (p.nome_regra && p.nome_regra.toLowerCase().includes(term)) ||
        (p.produto_id && p.produto_id.toLowerCase().includes(term))
    );
});

const editRule = (id) => {
    router.push({ name: 'rules', params: { produtoId: id } });
};

onMounted(fetchMyRules);
</script>

<template>
  <div class="page-container">
    
    <div class="header-row animate-up">
        <div class="header-text">
            <h1>Minhas Regras</h1>
            <p>Gerencie os produtos que já possuem tabelas de medidas ativas.</p>
        </div>
        <div class="stats-badge" v-if="rulesList.length > 0">
            <strong>{{ rulesList.length }}</strong> Produtos Configurados
        </div>
    </div>

    <div class="toolbar animate-up" style="animation-delay: 0.1s">
         <div class="search-box">
            <Search :size="16" class="s-icon"/>
            <input v-model="searchQuery" placeholder="Buscar nas minhas regras..." />
        </div>
        <button class="btn-primary-outline" @click="router.push('/rules/create')">
            + Adicionar Nova
        </button>
    </div>

    <div class="grid-layout animate-up" style="animation-delay: 0.2s">
        
        <div v-if="loading" class="state-msg">
            <div class="spinner"></div> Carregando regras...
        </div>
        
        <div v-else-if="filteredRules.length === 0" class="state-msg empty">
            <Ruler :size="48" class="icon-faded" />
            <h3>Nenhuma regra encontrada</h3>
            <p v-if="searchQuery">Nenhum resultado para "{{ searchQuery }}"</p>
            <p v-else>Você ainda não criou regras para nenhum produto.</p>
            <button v-if="!searchQuery" class="btn-link" @click="router.push('/rules/create')">
                Começar agora
            </button>
        </div>

        <div v-else v-for="item in filteredRules" :key="item.id" class="rule-card">
            <div class="card-header">
                <div class="status-badge">
                    <CheckCircle2 :size="12" /> Configurado
                </div>
                <span class="sku">{{ item.produto_id }}</span>
            </div>
            
            <div class="card-body">
                <h3>{{ item.nome_regra }}</h3>
                <div class="meta-info">
                    <Layers :size="14" /> 
                    <span>{{ item.total_regras }} {{ item.total_regras === 1 ? 'regra' : 'regras' }}</span>
                </div>
            </div>

            <div class="card-footer">
                <button class="btn-action edit" @click="editRule(item.produto_id)">
                    <Edit2 :size="16" /> Editar Regras
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* Adicionei apenas o estilo para o meta-info, o resto mantém */
.meta-info {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.8rem; color: #64748b; margin-top: 8px;
    background: #f8fafc; padding: 4px 8px; border-radius: 6px; width: fit-content;
}

/* ... Restante do CSS igual ao anterior ... */
.page-container { max-width: 1000px; margin: 0 auto; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-text h1 { font-size: 1.5rem; margin: 0; color: #1e293b; }
.header-text p { margin: 4px 0 0 0; color: #64748b; }
.stats-badge { background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid #bbf7d0; }
.toolbar { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.search-box { position: relative; max-width: 400px; flex: 1; }
.search-box input { width: 100%; padding: 10px 10px 10px 40px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem; transition: 0.2s; }
.search-box input:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.s-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.btn-primary-outline { padding: 8px 16px; background: white; border: 1px solid var(--color-primary); color: var(--color-primary); border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-primary-outline:hover { background: #eff6ff; }
.grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.rule-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; transition: all 0.2s; position: relative; }
.rule-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1); border-color: #cbd5e1; }
.card-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
.status-badge { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.sku { font-family: monospace; font-size: 0.75rem; color: #94a3b8; background: #f8fafc; padding: 2px 6px; border-radius: 4px; }
.card-body { padding: 0 16px 16px 16px; flex: 1; }
.card-body h3 { font-size: 1rem; color: #334155; margin: 0 0 4px 0; line-height: 1.4; font-weight: 600; }
.card-footer { padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #fcfcfc; }
.btn-action { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: white; cursor: pointer; font-weight: 600; font-size: 0.85rem; color: #475569; transition: background 0.2s; }
.btn-action:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
.btn-action.edit:hover { color: var(--color-primary); border-color: #bfdbfe; background: #eff6ff; }
.state-msg { grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 60px 20px; }
.state-msg.empty { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.icon-faded { opacity: 0.2; }
.spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px auto; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.btn-link { background: none; border: none; color: var(--color-primary); font-weight: 600; cursor: pointer; text-decoration: underline; }
.animate-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>