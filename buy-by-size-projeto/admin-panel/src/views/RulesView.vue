<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// 1. ADICIONADO: 'getProductsByModeling' na importação
import { 
    getModelingRules, saveRule, deleteRule, getModelingDetails, 
    getCatalogProducts, linkProductsBatch, unlinkProductsBatch,
    getProductsByModeling 
} from '@/api/apiService';
import { 
  ArrowLeft, Plus, Save, Trash2, Edit2, X, 
  AlertCircle, CheckCircle2, Ruler, ChevronRight, Shirt, Search,
  LayoutList, Unlink, Footprints
} from 'lucide-vue-next';

// --- CONSTANTES ---
const OPERATORS = [
    { value: '>=', label: 'Maior ou Igual (≥)' },
    { value: '<=', label: 'Menor ou Igual (≤)' },
    { value: '>', label: 'Maior que (>)' },
    { value: '<', label: 'Menor que (<)' },
    { value: '==', label: 'Igual a (=)' },
];

const FIELDS = [
    { value: 'altura', label: 'Altura (m)', step: 0.01, placeholder: '1.75' },
    { value: 'peso', label: 'Peso (kg)', step: 0.1, placeholder: '70.5' },
    { value: 'busto', label: 'Busto (cm)', step: 1, placeholder: '90' },
    { value: 'cintura', label: 'Cintura (cm)', step: 1, placeholder: '70' },
    { value: 'quadril', label: 'Quadril (cm)', step: 1, placeholder: '100' },
];

// --- ESTADOS ---
const route = useRoute();
const router = useRouter();
const modelingId = route.params.id;

const activeTab = ref('rules'); 
const modelingName = ref('Carregando...');
const rules = ref([]);
const linkedProducts = ref([]); 
const loading = ref(true);


const isShoeTable = computed(() => modelingName.value.includes('(Calçado)') || (currentModelingType.value === 'calcado'));
const currentModelingType = ref('roupa');
const newShoeRule = ref({
    sugestao_tamanho: '',
    pe_min: '',
    pe_max: ''
});

// Estado Edição Regra
const showForm = ref(false); 
const isEditing = ref(false);
const message = ref('');
const errorMessage = ref('');
const currentRule = ref(null);

// Estado Modal de Vínculo
const showProductModal = ref(false);
const productList = ref([]); // Lista carregada para o modal
const productSearch = ref('');
const selectedForLinking = ref([]);
const savingProducts = ref(false);

// --- LÓGICA DE CARREGAMENTO ---
const loadPageData = async () => {
    loading.value = true;
    try {
        // 1. Carrega Detalhes da Modelagem
        const details = await getModelingDetails(modelingId);
        if (details) {
            modelingName.value = details.nome;
            // CORREÇÃO CRÍTICA: Se vier null, força 'roupa'
            currentModelingType.value = details.tipo || 'roupa'; 
            console.log("Tipo da Modelagem:", currentModelingType.value); // Debug
        }
        
        // 2. Carrega Regras
        rules.value = await getModelingRules(modelingId);

        // 3. Carrega Produtos Vinculados (Usando a função corrigida)
        const linked = await getProductsByModeling(modelingId);
        linkedProducts.value = linked || [];
        
        console.log("Produtos Carregados:", linkedProducts.value); // Debug

    } catch (err) {
        errorMessage.value = 'Erro ao carregar dados.';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const handleSaveShoe = async () => {
    errorMessage.value = '';
    if (!newShoeRule.value.sugestao_tamanho || !newShoeRule.value.pe_min || !newShoeRule.value.pe_max) {
        return errorMessage.value = "Preencha tamanho, mínimo e máximo.";
    }

    try {
        const payload = {
            modelagem_id: modelingId,
            sugestao_tamanho: newShoeRule.value.sugestao_tamanho,
            pe_min: newShoeRule.value.pe_min ? parseFloat(newShoeRule.value.pe_min) : null,
            pe_max: newShoeRule.value.pe_max ? parseFloat(newShoeRule.value.pe_max) : null,
            prioridade: 0, 
            condicoes: []
        };

        await saveRule(payload);
        message.value = "Tamanho de calçado adicionado!";
        
        // Limpar e Recarregar
        newShoeRule.value = { sugestao_tamanho: '', pe_min: '', pe_max: '' };
        rules.value = await getModelingRules(modelingId);
        
        setTimeout(() => message.value = '', 2000);

    } catch (err) {
        errorMessage.value = "Erro ao salvar calçado.";
    }
};

const openProductModal = async () => {
    errorMessage.value = '';
    
    // Só carrega o catálogo geral se ainda não tiver carregado
    if (productList.value.length === 0) {
        try {
            // Nota: Buscando página 1 com limite maior para facilitar seleção inicial
            // Idealmente implementaria busca server-side dentro do modal no futuro
            const data = await getCatalogProducts(1, ''); 
            productList.value = data.produtos || [];
        } catch (err) {
            alert('Erro ao carregar catálogo.');
            return;
        }
    }
    
    // Pré-seleciona os IDs que já estão na lista linkedProducts
    selectedForLinking.value = []; // Reseta seleções manuais anteriores
    
    showProductModal.value = true;
};

// --- AÇÕES DE PRODUTOS ---

const openLinkModal = () => {
    openProductModal(); // Chama a função que carrega os dados
};

// 2. CORRIGIDO: Usava 'allProducts' que não existia, agora usa 'productList'
const modalProductList = computed(() => {
    let list = productList.value;
    
    // Busca Local no Modal
    if (productSearch.value) {
        const term = productSearch.value.toLowerCase();
        list = list.filter(p => p.nome_regra.toLowerCase().includes(term) || p.produto_id.includes(term));
    }
    
    // Mostra produtos disponíveis (sem modelagem ou já desta modelagem)
    return list.filter(p => !p.modelagem_id || p.modelagem_id === modelingId);
});

const toggleSelection = (id) => {
    if (selectedForLinking.value.includes(id)) {
        selectedForLinking.value = selectedForLinking.value.filter(i => i !== id);
    } else {
        selectedForLinking.value.push(id);
    }
};

const handleLinkProducts = async () => {
    if (selectedForLinking.value.length === 0) return;
    savingProducts.value = true;
    try {
        await linkProductsBatch(selectedForLinking.value, modelingId);
        message.value = 'Produtos vinculados com sucesso!';
        showProductModal.value = false;
        
        // Limpa a lista do modal para forçar recarregamento atualizado na próxima vez
        productList.value = []; 
        
        await loadPageData(); // Recarrega a tela para mostrar os novos vinculados
        setTimeout(() => message.value = '', 3000);
    } catch (err) {
        alert('Erro ao vincular.');
    } finally {
        savingProducts.value = false;
    }
};

const handleUnlink = async (productId) => {
    if (!confirm('Desvincular este produto?')) return;
    try {
        await unlinkProductsBatch([productId]);
        // Remove da lista localmente
        linkedProducts.value = linkedProducts.value.filter(p => p.id !== productId);
    } catch (err) {
        alert('Erro ao desvincular.');
    }
};

// --- LÓGICA DE REGRAS ---
const newRuleState = () => ({
    modelagem_id: modelingId,
    condicoes: [{ campo: 'altura', operador: '>=', valor: '' }],
    sugestao_tamanho: '',
    prioridade: 10
});
const openCreateForm = () => { currentRule.value = newRuleState(); isEditing.value = false; showForm.value = true; message.value = ''; errorMessage.value = ''; };
const openEditForm = (rule) => { currentRule.value = JSON.parse(JSON.stringify(rule)); isEditing.value = true; showForm.value = true; message.value = ''; errorMessage.value = ''; };
const closeForm = () => { showForm.value = false; currentRule.value = null; };
const addCondition = () => { currentRule.value.condicoes.push({ campo: 'peso', operador: '<', valor: '' }); };
const removeCondition = (index) => { currentRule.value.condicoes.splice(index, 1); };
const handleSave = async () => {
    message.value = ''; errorMessage.value = '';
    if (!currentRule.value.sugestao_tamanho) return errorMessage.value = 'Informe o Tamanho Sugerido.';
    const hasInvalid = currentRule.value.condicoes.some(c => c.valor === '' || c.valor === null);
    if (hasInvalid) return errorMessage.value = 'Preencha todos os valores.';
    try {
        await saveRule(currentRule.value);
        message.value = isEditing.value ? 'Regra atualizada!' : 'Regra criada!';
        rules.value = await getModelingRules(modelingId);
        setTimeout(closeForm, 1000);
    } catch (err) { errorMessage.value = err.response?.data?.error || 'Erro ao salvar.'; }
};
const handleDeleteRule = async (ruleId) => {
    if (!confirm('Excluir esta regra?')) return;
    try { await deleteRule(ruleId); rules.value = await getModelingRules(modelingId); } catch (err) { alert('Erro ao excluir.'); }
};
const getFieldLabel = (val) => FIELDS.find(f => f.value === val)?.label || val;
const getOperatorLabel = (val) => { const op = OPERATORS.find(o => o.value === val); return op ? op.label.split('(')[0].trim() : val; };

onMounted(loadPageData);
</script>

<template>
  <div class="page-container">
    
    <div class="page-header animate-up">
      <div class="header-left">
        <button class="btn-back" @click="router.back()">
            <ArrowLeft :size="18" /> Voltar
        </button>
        <div class="title-group">
            <span class="eyebrow">Editando Modelagem</span>
            <h1>{{ modelingName }}</h1>
        </div>
      </div>
      
      <div class="header-actions">
          <button v-if="activeTab === 'products'" class="btn-primary" @click="openLinkModal">
            <Plus :size="18" /> Vincular Produto
          </button>
          <button v-if="activeTab === 'rules' && currentModelingType !== 'calcado'" class="btn-primary" @click="openCreateForm" :disabled="showForm">
            <Plus :size="18" /> Nova Regra
          </button>
      </div>
    </div>

    <div v-if="message" class="alert success mb-4 animate-up"><CheckCircle2 :size="16"/> {{ message }}</div>

    <div class="tabs-container animate-up">
        <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'rules' }" 
            @click="activeTab = 'rules'"
        >
            <Ruler :size="18" /> Regras de Medida
            <span class="badge-pill">{{ rules.length }}</span>
        </button>
        <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'products' }" 
            @click="activeTab = 'products'"
        >
            <Shirt :size="18" /> Produtos Vinculados
            <span class="badge-pill">{{ linkedProducts.length }}</span>
        </button>
    </div>

    <div class="content-layout">
        
        <div v-if="activeTab === 'rules'" class="tab-content animate-up" style="animation-delay: 0.1s">
            
            <div class="type-banner" :class="currentModelingType === 'calcado' ? 'calcado' : 'roupa'">
                <Footprints v-if="currentModelingType === 'calcado'" :size="20"/>
                <Shirt v-else :size="20"/>
                <span>
                    {{ currentModelingType === 'calcado' ? 'Tabela de Medidas de Calçados' : 'Tabela de Medidas de Vestuário' }}
                </span>
            </div>

            <div v-if="loading" class="state-box">Carregando regras...</div>

            <div v-else-if="currentModelingType === 'calcado'" class="shoe-interface">
                
                <div class="rule-card add-shoe-card">
                    <h3>Adicionar Novo Tamanho</h3>
                    <div class="shoe-inputs">
                        <div class="grp">
                            <label>Tamanho (Etiqueta)</label>
                            <input v-model="newShoeRule.sugestao_tamanho" placeholder="Ex: 36" class="input-std">
                        </div>
                        <div class="grp">
                            <label>Pé Mínimo (cm)</label>
                            <input type="number" step="0.1" v-model="newShoeRule.pe_min" placeholder="23.0" class="input-std">
                        </div>
                        <div class="grp">
                            <label>Pé Máximo (cm)</label>
                            <input type="number" step="0.1" v-model="newShoeRule.pe_max" placeholder="23.5" class="input-std">
                        </div>
                        <button class="btn-primary" @click="handleSaveShoe">
                            <Plus :size="18"/> Adicionar
                        </button>
                    </div>
                    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
                </div>

                <div class="shoe-list">
                    <div v-for="rule in rules" :key="rule.id" class="shoe-item">
                        <div class="size-circle">{{ rule.sugestao_tamanho }}</div>
                        <div class="range-info">
                            <span class="range-label">Intervalo do Pé</span>
                            <span class="range-val">{{ rule.pe_min }}cm <span class="arrow">→</span> {{ rule.pe_max }}cm</span>
                        </div>
                        <button class="btn-icon-del" @click="handleDeleteRule(rule.id)">
                            <Trash2 :size="16"/>
                        </button>
                    </div>
                    <div v-if="rules.length === 0" class="empty-shoe">
                        Nenhum tamanho cadastrado ainda. Adicione acima.
                    </div>
                </div>
            </div>

            <div v-else>
                 <div v-if="rules.length === 0" class="state-box empty">
                    <Ruler :size="40" class="icon-faded" />
                    <h3>Nenhuma regra definida</h3>
                    <p>Ensine o provador como sugerir tamanhos para esta modelagem.</p>
                    <button class="btn-outline" @click="openCreateForm">Criar Primeira Regra</button>
                 </div>

                 <div v-else class="rules-grid">
                    <div v-for="rule in rules" :key="rule.id" class="rule-card" :class="{ 'editing': currentRule && currentRule.id === rule.id }">
                        <div class="card-content">
                            <div class="rule-conditions">
                                <span class="label-section">SE:</span>
                                <div class="conditions-container">
                                    <div v-for="(cond, idx) in rule.condicoes" :key="idx" class="condition-badge">
                                        <span class="cond-field">{{ getFieldLabel(cond.campo) }}</span>
                                        <span class="cond-op">{{ getOperatorLabel(cond.operador) }}</span>
                                        <span class="cond-val">{{ cond.valor }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="rule-arrow"><ChevronRight :size="24" /></div>
                            <div class="rule-result">
                                <span class="label-section">SUGERIR:</span>
                                <div class="size-box">{{ rule.sugestao_tamanho }}</div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="btn-action edit" @click="openEditForm(rule)"><Edit2 :size="14"/> Editar</button>
                            <button class="btn-action delete" @click="handleDeleteRule(rule.id)"><Trash2 :size="14"/> Excluir</button>
                        </div>
                    </div>
                 </div>
            </div>
        </div>

        <div v-if="activeTab === 'products'" class="tab-content animate-up" style="animation-delay: 0.1s">
            
            <div v-if="loading" class="state-box">Carregando produtos...</div>
            
            <div v-else-if="linkedProducts.length === 0" class="state-box empty">
                <Shirt :size="40" class="icon-faded" />
                <h3>Nenhum produto vinculado</h3>
                <p>Vincule produtos do seu catálogo a esta modelagem para aplicar as regras.</p>
                <button class="btn-outline" @click="openLinkModal">Vincular Produtos</button>
            </div>

            <div v-else class="products-table-card">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th width="50%">Produto</th>
                            <th width="30%">SKU</th>
                            <th width="20%" class="text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="prod in linkedProducts" :key="prod.id">
                            <td>
                                <div class="prod-info-row">
                                    <div class="icon-sq"><Shirt :size="16"/></div>
                                    <span class="p-name">{{ prod.nome || 'Produto sem nome' }}</span>
                                </div>
                            </td>
                            <td class="text-code">{{ prod.produto_id }}</td>
                            <td class="text-right">
                                <button class="btn-unlink" @click="handleUnlink(prod.id)" title="Desvincular">
                                    <Unlink :size="16" /> Desvincular
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <transition name="slide-in">
            <div v-if="showForm" class="editor-sidebar">
                <div class="sidebar-header">
                    <h3>{{ isEditing ? 'Editar Regra' : 'Nova Regra' }}</h3>
                    <button class="close-icon" @click="closeForm"><X :size="20" /></button>
                </div>
                <div class="sidebar-content">
                    <div v-if="errorMessage" class="alert error"><AlertCircle :size="16"/> {{ errorMessage }}</div>
                    
                    <div class="form-section highlight-section">
                        <label>Resultado</label>
                        <div class="result-inputs">
                            <div class="input-col"><span class="sub-label">Tamanho</span><input v-model="currentRule.sugestao_tamanho" placeholder="Ex: M" class="input-big"></div>
                            <div class="input-col"><span class="sub-label">Prioridade</span><input type="number" v-model.number="currentRule.prioridade" class="input-big"></div>
                        </div>
                    </div>

                    <div class="form-section">
                        <div class="section-top"><label>Condições</label><button class="btn-small" @click="addCondition"><Plus :size="14"/> Add</button></div>
                        <div class="conditions-list-form">
                            <div v-for="(cond, index) in currentRule.condicoes" :key="index" class="condition-row-stacked">
                                <div class="row-top">
                                    <div class="field-wrapper">
                                        <select v-model="cond.campo"><option v-for="f in FIELDS" :value="f.value">{{ f.label }}</option></select>
                                        <button class="remove-btn" @click="removeCondition(index)" :disabled="currentRule.condicoes.length === 1"><Trash2 :size="14" /></button>
                                    </div>
                                </div>
                                <div class="row-bottom">
                                    <div class="half-col"><select v-model="cond.operador"><option v-for="op in OPERATORS" :value="op.value">{{ op.label }}</option></select></div>
                                    <div class="half-col"><input type="number" v-model.number="cond.valor" :step="FIELDS.find(f => f.value === cond.campo)?.step"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="sidebar-footer">
                    <button class="btn-text" @click="closeForm">Cancelar</button>
                    <button class="btn-primary full" @click="handleSave"><Save :size="18" /> Salvar</button>
                </div>
            </div>
        </transition>

    </div>

    <div v-if="showProductModal" class="modal-overlay" @click.self="showProductModal = false">
        <div class="modal-card wide animate-scale">
            <div class="modal-header">
                <h3>Vincular Produtos</h3>
                <button class="close-icon" @click="showProductModal = false"><X :size="20"/></button>
            </div>
            
            <div class="modal-search">
                <Search :size="16" class="search-icon"/>
                <input v-model="productSearch" placeholder="Buscar produto..." autofocus>
            </div>

            <div class="products-list-scroll">
                <div v-if="modalProductList.length === 0" class="empty-search">Nenhum produto disponível para vínculo.</div>
                
                <div 
                    v-for="prod in modalProductList" 
                    :key="prod.id" 
                    class="product-item"
                    :class="{'selected': selectedForLinking.includes(prod.id) || prod.modelagem_id === modelingId}"
                    @click="toggleSelection(prod.id)"
                >
                    <div class="check-square">
                        <div v-if="selectedForLinking.includes(prod.id) || prod.modelagem_id === modelingId" class="check-fill"></div>
                    </div>
                    <div class="prod-info">
                        <span class="prod-name">{{ prod.nome || prod.nome_regra }}</span>
                        <span class="prod-sku">{{ prod.produto_id }}</span>
                    </div>
                    <span v-if="prod.modelagem_id === modelingId" class="tag-current">Já Vinculado</span>
                </div>
            </div>

            <div class="modal-footer">
                <span class="selection-info">{{ selectedForLinking.length }} selecionados</span>
                <div class="actions">
                    <button class="btn-text" @click="showProductModal = false">Cancelar</button>
                    <button class="btn-primary" @click="handleLinkProducts" :disabled="savingProducts">
                        {{ savingProducts ? 'Salvando...' : 'Vincular Selecionados' }}
                    </button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>

<style scoped>
/* ESTILO DE ABAS */
.tabs-container { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
.tab-btn {
    display: flex; align-items: center; gap: 8px; padding: 10px 20px;
    background: transparent; border: none; border-bottom: 2px solid transparent;
    color: #64748b; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 0.95rem;
}
.tab-btn:hover { color: #334155; }
.tab-btn.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.badge-pill { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
.tab-btn.active .badge-pill { background: #eff6ff; color: var(--color-primary); }

.tab-content { width: 100%; flex: 1; }

/* TABELA DE PRODUTOS VINCULADOS */
.products-table-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 14px 20px; background: #f8fafc; color: #64748b; font-size: 0.8rem; text-transform: uppercase; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
.modern-table td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.prod-info-row { display: flex; align-items: center; gap: 12px; }
.icon-sq { width: 32px; height: 32px; background: #f1f5f9; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
.p-name { font-weight: 600; color: #334155; font-size: 0.9rem; }
.text-code { font-family: monospace; color: #64748b; font-size: 0.85rem; }
.btn-unlink { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; color: #64748b; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-unlink:hover { color: #ef4444; border-color: #fca5a5; background: #fef2f2; }

/* MODAL checkbox quadrado */
.check-square { width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 4px; margin-right: 15px; display: flex; align-items: center; justify-content: center; background: white; transition: 0.2s; }
.product-item.selected .check-square { border-color: var(--color-primary); }
.check-fill { width: 12px; height: 12px; background: var(--color-primary); border-radius: 2px; }
.tag-current { font-size: 0.7rem; background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 600; }

/* REUTILIZAÇÃO DE ESTILOS DA PÁGINA (Igual ao anterior) */
.page-container { max-width: 1200px; margin: 0 auto; position: relative; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; } /* Menor margem pois tem tabs */
.header-left { display: flex; align-items: center; gap: 16px; }
.btn-back { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 500; }
.btn-back:hover { background: #f8fafc; color: #0f172a; }
.title-group h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin: 0; }
.eyebrow { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
.btn-primary { background: var(--color-primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px -1px rgba(0, 123, 255, 0.2); }
.header-actions { display: flex; gap: 12px; }
.content-layout { display: flex; gap: 24px; align-items: flex-start; }
.rules-list { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.rules-grid { display: flex; flex-direction: column; gap: 24px; }
.rule-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.2s; position: relative; overflow: hidden; display: flex; flex-direction: column; }
.rule-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #cbd5e1; }
.rule-card.editing { border: 2px solid var(--color-primary); }
.card-content { display: flex; padding: 20px; align-items: stretch; }
.rule-conditions { flex: 1; }
.label-section { display: block; font-size: 0.7rem; font-weight: 700; color: #94a3b8; margin-bottom: 10px; letter-spacing: 0.05em; }
.conditions-container { display: flex; flex-direction: column; gap: 6px; } 
.condition-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #334155; background: #f8fafc; padding: 4px 8px; border-radius: 6px; width: fit-content; }
.cond-field { font-weight: 600; text-transform: capitalize; }
.cond-op { color: #64748b; font-weight: 500; }
.cond-val { color: var(--color-primary); font-weight: 700; }
.rule-arrow { display: flex; align-items: center; justify-content: center; color: #cbd5e1; padding: 0 20px; }
.rule-result { width: 140px; background: #f0f9ff; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; border: 1px solid #e0f2fe; }
.size-box { font-size: 2rem; font-weight: 800; color: var(--color-primary); line-height: 1; margin-bottom: 4px; }
.priority-tag { font-size: 0.75rem; color: #0369a1; font-weight: 600; }
.card-footer { border-top: 1px solid #f1f5f9; padding: 10px 20px; display: flex; justify-content: flex-end; gap: 12px; background: #fcfcfc; }
.btn-action { background: transparent; border: none; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }
.btn-action.edit { color: var(--color-primary); }
.btn-action.delete { color: var(--color-error); }
.editor-sidebar { width: 700px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.1); position: sticky; top: 20px; display: flex; flex-direction: column; max-height: calc(100vh - 40px); }
.sidebar-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.sidebar-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
.close-icon { background: none; border: none; color: #94a3b8; cursor: pointer; }
.sidebar-content { padding: 20px; overflow-y: auto; flex: 1; }
.highlight-section { background: #f0f9ff; border: 1px solid #e0f2fe; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
.highlight-section label { color: #0369a1; font-weight: 700; margin-bottom: 8px; display: block; font-size: 0.85rem; }
.result-inputs { display: flex; gap: 12px; }
.input-col { flex: 1; }
.sub-label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 4px; }
.input-big { width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 1.1rem; font-weight: 600; text-align: center; color: #0f172a; }
.input-big:focus { border-color: var(--color-primary); outline: none; }
.section-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.section-top label { font-weight: 700; font-size: 0.9rem; color: #334155; }
.btn-small { background: #f1f5f9; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; color: var(--color-primary); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.conditions-list-form { display: flex; flex-direction: column; gap: 12px; }
.condition-row-stacked { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
.row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.field-label-small { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.field-wrapper { display: flex; gap: 8px; align-items: center; width: 100%; justify-content: flex-end;}
.field-wrapper select, .half-col select { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; color: #334155; background-color: white; appearance: none; -webkit-appearance: none; -moz-appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; }
.field-wrapper select:focus, .half-col select:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1); }
.row-bottom { display: flex; gap: 8px; }
.half-col { flex: 1; }
.half-col input { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; background: white; }
.half-col input:focus { outline: none; border-color: var(--color-primary); }
.remove-btn { background: white; border: 1px solid #e2e8f0; color: #cbd5e1; cursor: pointer; padding: 5px; border-radius: 4px; }
.remove-btn:hover { color: var(--color-error); border-color: #fca5a5; }
.remove-btn:disabled { opacity: 0; cursor: default; }
.hint-text { font-size: 0.8rem; color: #94a3b8; margin-top: 15px; font-style: italic; }
.sidebar-footer { padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; gap: 12px; }
.btn-text { background: none; border: none; color: #64748b; font-weight: 500; cursor: pointer; }
.full { flex: 1; justify-content: center; }
.alert { padding: 10px; border-radius: 6px; font-size: 0.9rem; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.alert.error { background: #fef2f2; color: #b91c1c; }
.alert.success { background: #f0fdf4; color: #166534; }
.state-box { padding: 40px; text-align: center; color: #94a3b8; }
.icon-faded { opacity: 0.3; margin-bottom: 10px; }
.btn-outline { margin-top: 15px; border: 1px solid #e2e8f0; background: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(2px); }
.modal-card.wide { width: 600px; max-width: 95%; padding: 0; display: flex; flex-direction: column; max-height: 85vh; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
.modal-header { padding: 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
.modal-search { padding: 15px 20px; border-bottom: 1px solid #f1f5f9; position: relative; }
.modal-search input { width: 100%; padding: 10px 10px 10px 36px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; }
.search-icon { position: absolute; left: 30px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
.products-list-scroll { flex: 1; overflow-y: auto; padding: 10px 0; background-color: white; }
.product-item { display: flex; align-items: center; padding: 14px 24px; cursor: pointer; transition: background-color 0.2s; border-bottom: 1px solid #f1f5f9; }
.product-item:hover { background: #f8fafc; }
.product-item.selected { background: #eff6ff; }
.prod-info { flex: 1; }
.prod-name { display: block; font-weight: 600; color: #334155; font-size: 0.95rem; margin-bottom: 2px; }
.prod-sku { font-size: 0.8rem; color: #94a3b8; font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
.modal-footer { padding: 15px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #fcfcfc; border-radius: 0 0 16px 16px; }
.selection-info { font-size: 0.85rem; color: #64748b; font-weight: 600; }
.actions { display: flex; gap: 10px; }
.animate-up { animation: fadeUp 0.4s ease-out forwards; opacity: 0; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.slide-in-enter-active, .slide-in-leave-active { transition: all 0.3s ease; }
.slide-in-enter-from, .slide-in-leave-to { transform: translateX(20px); opacity: 0; }
.modal-card.animate-scale { animation: scaleIn 0.2s ease-out forwards; }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (max-width: 1024px) { .content-layout { flex-direction: column; } .editor-sidebar { width: 100%; position: fixed; bottom: 0; top: auto; left: 0; right: 0; border-radius: 16px 16px 0 0; z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); } .sidebar-content { max-height: 60vh; } }

/* ESTILOS NOVOS PARA CALÇADOS */
.type-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;
    font-weight: 700; color: #334155;
}
.type-banner.calcado { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.type-banner.roupa { background: #f0f9ff; color: #0369a1; border: 1px solid #e0f2fe; }

.shoe-interface { display: flex; flex-direction: column; gap: 24px; }

.add-shoe-card { padding: 20px; background: #f8fafc; border: 1px dashed #cbd5e1; }
.add-shoe-card h3 { margin-top: 0; font-size: 1rem; color: #475569; margin-bottom: 15px; }

.shoe-inputs { display: flex; gap: 16px; align-items: flex-end; }
.grp { flex: 1; }
.grp label { display: block; font-size: 0.8rem; font-weight: 700; color: #64748b; margin-bottom: 6px; }
.input-std { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; }

.error-text { color: #dc2626; font-size: 0.9rem; margin-top: 10px; }

.shoe-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }

.shoe-item {
    background: white; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: 16px; display: flex; align-items: center; gap: 16px;
    position: relative; transition: all 0.2s;
}
.shoe-item:hover { border-color: #94a3b8; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

.size-circle {
    width: 48px; height: 48px; background: #1e293b; color: white;
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; font-weight: 800; flex-shrink: 0;
}

.range-info { display: flex; flex-direction: column; }
.range-label { font-size: 0.7rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; }
.range-val { font-size: 0.95rem; font-weight: 600; color: #334155; }
.arrow { color: #cbd5e1; margin: 0 4px; }

.btn-icon-del {
    position: absolute; top: 10px; right: 10px;
    background: none; border: none; color: #cbd5e1; cursor: pointer;
}
.btn-icon-del:hover { color: #ef4444; }

.empty-shoe { grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 40px; font-style: italic; }
</style>