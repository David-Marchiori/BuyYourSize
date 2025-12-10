<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getModelings, createModeling } from '@/api/apiService';
import { 
    Ruler, Plus, Edit2, Search, CheckCircle2, Shirt, Footprints // <--- 1. IMPORTAR FOOTPRINTS
} from 'lucide-vue-next';

const router = useRouter();
const modelings = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const newName = ref('');
const newType = ref('roupa'); // <--- 2. NOVA VARIÁVEL DE ESTADO
const creating = ref(false);
const searchQuery = ref('');

const fetchModelings = async () => {
    loading.value = true;
    try {
        modelings.value = await getModelings();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const handleCreate = async () => {
    if (!newName.value.trim()) return;
    creating.value = true;
    try {
        // <--- 3. PASSAR O TIPO PARA A API
        await createModeling(newName.value, newType.value); 
        
        newName.value = '';
        newType.value = 'roupa'; // Resetar para o padrão
        showCreateModal.value = false;
        await fetchModelings();
    } catch (err) {
        alert('Erro ao criar modelagem.');
    } finally {
        creating.value = false;
    }
};

// ... resto do código (computed, onMounted) igual ...
const filteredModelings = computed(() => {
    if (!searchQuery.value) return modelings.value;
    const term = searchQuery.value.toLowerCase();
    return modelings.value.filter(m => m.nome.toLowerCase().includes(term));
});

const goToRules = (id) => {
    router.push({ name: 'modeling-rules', params: { id: id } });
};

onMounted(fetchModelings);
</script>

<template>
  <div class="page-container">
    
    <div class="header-row animate-up">
        <div class="header-text">
            <h1>Modelagens</h1>
            <p>Crie e gerencie suas tabelas de medidas padrão.</p>
        </div>
        <div class="stats-badge" v-if="modelings.length > 0">
            <strong>{{ modelings.length }}</strong> Tabelas Criadas
        </div>
    </div>

    <div class="toolbar animate-up" style="animation-delay: 0.1s">
         <div class="search-box">
            <Search :size="16" class="s-icon"/>
            <input v-model="searchQuery" placeholder="Buscar modelagem..." />
        </div>
        <button class="btn-primary-outline" @click="showCreateModal = true">
            <Plus :size="16" /> Nova Modelagem
        </button>
    </div>

    <div class="grid-layout animate-up" style="animation-delay: 0.2s">
        
        <div v-if="loading" class="state-msg">
            <div class="spinner"></div> Carregando...
        </div>
        
        <div v-else-if="filteredModelings.length === 0" class="state-msg empty">
            <Ruler :size="48" class="icon-faded"/>
            <h3>Nenhuma modelagem encontrada</h3>
            <p v-if="searchQuery">Sem resultados para "{{ searchQuery }}"</p>
            <p v-else>Crie sua primeira tabela de medidas (ex: "Camisetas") para começar.</p>
            <button v-if="!searchQuery" class="btn-link" @click="showCreateModal = true">Criar agora</button>
        </div>

        <div v-else class="rule-card" v-for="item in filteredModelings" :key="item.id">
            <div class="card-header">
                <div class="status-badge">
                    <CheckCircle2 :size="12" /> Ativa
                </div>
                <span class="date">{{ new Date(item.created_at).toLocaleDateString() }}</span>
            </div>
            
            <div class="card-body">
                <h3>{{ item.nome }}</h3>
                
                <div class="meta-info">
                    <Shirt :size="14" /> 
                    <span>
                        <strong>{{ item.total_produtos }}</strong> 
                        {{ item.total_produtos === 1 ? 'produto vinculado' : 'produtos vinculados' }}
                    </span>
                </div>
            </div>

            <div class="card-footer">
                <button class="btn-action edit" @click="goToRules(item.id)">
                    <Edit2 :size="16" /> Configurar Regras
                </button>
            </div>
        </div>

    </div>

   <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-card animate-scale">
            <h3>Nova Modelagem</h3>

            <label>O que você vai medir?</label>
            <div class="type-selector">
                <div 
                    class="type-option" 
                    :class="{ active: newType === 'roupa' }"
                    @click="newType = 'roupa'"
                >
                    <Shirt :size="20" />
                    <span>Vestuário</span>
                </div>
                <div 
                    class="type-option" 
                    :class="{ active: newType === 'calcado' }"
                    @click="newType = 'calcado'"
                >
                    <Footprints :size="20" />
                    <span>Calçados</span>
                </div>
            </div>
            <label>Nome da Tabela (Ex: {{ newType === 'roupa' ? 'Calça Jeans' : 'Tênis Running' }})</label>
            <input v-model="newName" placeholder="Digite o nome..." autofocus @keyup.enter="handleCreate">
            
            <div class="modal-actions">
                <button class="btn-text" @click="showCreateModal = false">Cancelar</button>
                <button class="btn-primary" @click="handleCreate" :disabled="creating || !newName">
                    {{ creating ? 'Criando...' : 'Criar' }}
                </button>
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
/* Copiado e adaptado do MyRulesListView para manter consistência total */
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

.btn-primary-outline { 
    padding: 8px 16px; background: white; border: 1px solid var(--color-primary); 
    color: var(--color-primary); border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; 
    display: flex; align-items: center; gap: 6px;
}
.btn-primary-outline:hover { background: #eff6ff; }

.grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

.rule-card {
    background: white; border: 1px solid #e2e8f0; border-radius: 12px;
    display: flex; flex-direction: column; overflow: hidden; transition: all 0.2s; position: relative;
}
.rule-card:hover { transform: translateY(-4px); box-shadow: 0 12px 20px -8px rgba(0,0,0,0.1); border-color: #cbd5e1; }

.card-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
.status-badge { 
    display: flex; align-items: center; gap: 4px; font-size: 0.7rem; 
    background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
}
.date { font-family: monospace; font-size: 0.75rem; color: #94a3b8; background: #f8fafc; padding: 2px 6px; border-radius: 4px; }

.card-body { padding: 0 16px 16px 16px; flex: 1; }
.card-body h3 { font-size: 1.1rem; color: #334155; margin: 0 0 8px 0; line-height: 1.4; font-weight: 600; }

.meta-info {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.8rem; color: #64748b; margin-top: 8px;
    background: #f8fafc; padding: 6px 10px; border-radius: 6px; width: fit-content; border: 1px solid #f1f5f9;
}
.meta-info strong { color: #334155; }

.card-footer { padding: 12px 16px; border-top: 1px solid #f1f5f9; background: #fcfcfc; }
.btn-action {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0; background: white;
    cursor: pointer; font-weight: 600; font-size: 0.85rem; color: #475569; transition: background 0.2s;
}
.btn-action:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
.btn-action.edit:hover { color: var(--color-primary); border-color: #bfdbfe; background: #eff6ff; }

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(2px); }
.modal-card { background: white; padding: 24px; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
.modal-card h3 { margin-top: 0; margin-bottom: 15px; color: #1e293b; }
.modal-card label { font-size: 0.9rem; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
.modal-card input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin: 0 0 20px 0; font-size: 1rem; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-text { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; padding: 10px; }
.btn-primary { background: var(--color-primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }

/* ESTADOS */
.state-msg { grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 60px 20px; }
.state-msg.empty { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.icon-faded { opacity: 0.2; }
.spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px auto; }
@keyframes spin { 100% { transform: rotate(360deg); } }
.btn-link { background: none; border: none; color: var(--color-primary); font-weight: 600; cursor: pointer; text-decoration: underline; }

.animate-up { animation: fadeInUp 0.4s ease-out forwards; opacity: 0; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-scale { animation: scaleIn 0.2s ease-out forwards; }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* 5. ESTILOS DO SELETOR DE TIPO */
.type-selector {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.type-option {
    flex: 1;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #64748b;
    background: #f8fafc;
}

.type-option span {
    font-size: 0.9rem;
    font-weight: 600;
}

.type-option:hover {
    border-color: #94a3b8;
    background: #f1f5f9;
}

.type-option.active {
    border-color: var(--color-primary); /* Usa a cor azul definida no seu projeto */
    background: #eff6ff; /* Azul bem clarinho */
    color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
</style>