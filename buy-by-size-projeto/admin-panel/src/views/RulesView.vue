<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProductRules, saveRule, deleteRule } from '@/api/apiService';
import { 
  ArrowLeft, Plus, Save, Trash2, Edit2, X, 
  AlertCircle, CheckCircle2, Ruler, ArrowRight,
  ChevronUp, ChevronDown, MoreVertical
} from 'lucide-vue-next';

// --- CONSTANTES & UTILS ---
const OPERATORS = [
    { value: '>=', label: 'Maior ou Igual (>=)' },
    { value: '<=', label: 'Menor ou Igual (<=)' },
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
const produtoId = ref(route.params.produtoId); 
const rules = ref([]);
const loading = ref(true);
const isEditing = ref(false);
const showForm = ref(false); // Controla visibilidade do formulário
const message = ref('');
const errorMessage = ref('');

// Estado da Regra Atual
const currentRule = ref(null);

// --- LÓGICA DE NEGÓCIO ---

// Estado inicial para nova regra
const newRuleState = () => ({
    produto_id: produtoId.value,
    condicoes: [{ campo: 'altura', operador: '>=', valor: '' }],
    sugestao_tamanho: '',
    prioridade: 10
});

const fetchRules = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        rules.value = await getProductRules(produtoId.value);
    } catch (err) {
        errorMessage.value = 'Erro ao carregar regras.';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const openCreateForm = () => {
    currentRule.value = newRuleState();
    isEditing.value = false; // Modo Criação
    showForm.value = true;
    message.value = '';
};

const openEditForm = (rule) => {
    // Deep copy para não alterar a lista enquanto edita
    currentRule.value = JSON.parse(JSON.stringify(rule));
    isEditing.value = true; // Modo Edição
    showForm.value = true;
    message.value = '';
};

const closeForm = () => {
    showForm.value = false;
    currentRule.value = null;
    message.value = '';
    errorMessage.value = '';
};

const addCondition = () => {
    currentRule.value.condicoes.push({ campo: 'peso', operador: '<', valor: '' });
};

const removeCondition = (index) => {
    currentRule.value.condicoes.splice(index, 1);
};

const handleSave = async () => {
    message.value = '';
    errorMessage.value = '';
    
    // Validação Básica
    if (!currentRule.value.sugestao_tamanho) {
        errorMessage.value = 'Informe o Tamanho Sugerido (ex: P, M).';
        return;
    }
    const hasInvalidCondition = currentRule.value.condicoes.some(c => c.valor === '' || c.valor === null);
    if (hasInvalidCondition) {
        errorMessage.value = 'Preencha os valores de todas as condições.';
        return;
    }

    try {
        await saveRule(currentRule.value);
        message.value = isEditing.value ? 'Regra atualizada!' : 'Regra criada com sucesso!';
        await fetchRules();
        setTimeout(closeForm, 1500); // Fecha após sucesso
    } catch (err) {
        errorMessage.value = err.response?.data?.error || 'Erro ao salvar regra.';
    }
};

const handleDelete = async (ruleId) => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    
    try {
        await deleteRule(ruleId);
        await fetchRules(); // Recarrega silenciosamente
    } catch (err) {
        alert('Erro ao excluir regra.');
    }
};

// Formatação Visual
const getFieldLabel = (val) => FIELDS.find(f => f.value === val)?.label || val;
const getOperatorLabel = (val) => OPERATORS.find(o => o.value === val)?.label || val;

onMounted(fetchRules);
</script>

<template>
  <div class="page-container">
    <!-- Overlay for mobile/tablet when form is open -->
    <transition name="fade">
        <div v-if="showForm" class="mobile-overlay" @click="closeForm"></div>
    </transition>

    <div class="page-header animate-up">
      <div class="header-content">
        <button class="btn-back" @click="router.back()">
            <ArrowLeft :size="18" /> Voltar
        </button>
        <div>
            <h1 class="product-title">Regras de Sugestão</h1>
            <p class="product-subtitle">Produto ID: <span class="mono">{{ produtoId }}</span></p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openCreateForm" :disabled="showForm">
          <Plus :size="18" /> Nova Regra
        </button>
      </div>
    </div>

    <div class="rules-layout">
        
        <div class="rules-list-container animate-up" style="animation-delay: 0.1s">
            
            <div v-if="loading" class="loading-state">
                <div class="spinner"></div> Carregando regras...
            </div>

            <div v-else-if="rules.length === 0" class="empty-state">
                <div class="icon-circle"><Ruler :size="32" /></div>
                <h3>Nenhuma regra definida</h3>
                <p>Crie a primeira regra para que este produto possa ser recomendado.</p>
                <button class="btn-outline" @click="openCreateForm">Criar Regra Agora</button>
            </div>

            <div v-else class="rules-grid">
                <div 
                    v-for="rule in rules" 
                    :key="rule.id" 
                    class="rule-card"
                    :class="{ 'active': currentRule && currentRule.id === rule.id }"
                >
                    <div class="rule-header">
                        <div class="suggestion-badge">
                            <span class="label">Sugere</span>
                            <span class="size">{{ rule.sugestao_tamanho }}</span>
                        </div>
                        <div class="rule-meta">
                            <div class="priority-badge">
                                Prioridade {{ rule.prioridade }}
                            </div>
                        </div>
                        <div class="actions">
                            <button class="icon-btn edit" @click="openEditForm(rule)" title="Editar">
                                <Edit2 :size="16" />
                            </button>
                            <button class="icon-btn delete" @click="handleDelete(rule.id)" title="Excluir">
                                <Trash2 :size="16" />
                            </button>
                        </div>
                    </div>

                    <div class="rule-conditions">
                        <div v-for="(cond, idx) in rule.condicoes" :key="idx" class="condition-chip">
                            <span class="field">{{ getFieldLabel(cond.campo) }}</span>
                            <span class="operator">{{ cond.operador }}</span>
                            <span class="value">{{ cond.valor }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <transition name="slide-fade">
            <div v-if="showForm" class="rule-editor-panel">
                <div class="panel-header">
                    <h3>{{ isEditing ? 'Editar Regra' : 'Nova Regra' }}</h3>
                    <button class="close-btn" @click="closeForm"><X :size="20" /></button>
                </div>

                <div class="panel-body">
                    
                    <div v-if="errorMessage" class="alert error"><AlertCircle :size="16"/> {{ errorMessage }}</div>
                    <div v-if="message" class="alert success"><CheckCircle2 :size="16"/> {{ message }}</div>

                    <div class="form-section">
                        <label>Resultado e Prioridade</label>
                        <div class="row-inputs">
                            <div class="input-group">
                                <span class="input-label">Tamanho Sugerido</span>
                                <input v-model="currentRule.sugestao_tamanho" placeholder="Ex: M" class="input-lg">
                            </div>
                            <div class="input-group">
                                <span class="input-label">Prioridade</span>
                                <input type="number" v-model.number="currentRule.prioridade" class="input-lg">
                            </div>
                        </div>
                    </div>

                    <div class="separator"></div>

                    <div class="form-section">
                        <div class="section-header">
                            <label>Condições Lógicas (SE)</label>
                            <button class="btn-xs" @click="addCondition"><Plus :size="14" /> Adicionar</button>
                        </div>
                        
                        <div class="conditions-list">
                            <div v-for="(cond, index) in currentRule.condicoes" :key="index" class="condition-row animate-in">
                                <div class="cond-inputs">
                                    <div class="input-wrapper field-select">
                                        <select v-model="cond.campo">
                                            <option v-for="f in FIELDS" :key="f.value" :value="f.value">{{ f.label }}</option>
                                        </select>
                                        <ChevronDown :size="14" class="select-arrow"/>
                                    </div>
                                    <div class="input-wrapper operator-select">
                                        <select v-model="cond.operador">
                                            <option v-for="op in OPERATORS" :key="op.value" :value="op.value">{{ op.value }}</option>
                                        </select>
                                        <ChevronDown :size="14" class="select-arrow"/>
                                    </div>
                                    <input 
                                        type="number" 
                                        v-model.number="cond.valor" 
                                        :placeholder="FIELDS.find(f => f.value === cond.campo)?.placeholder"
                                        :step="FIELDS.find(f => f.value === cond.campo)?.step"
                                        class="value-input"
                                    >
                                </div>
                                <button 
                                    class="btn-remove" 
                                    @click="removeCondition(index)"
                                    :disabled="currentRule.condicoes.length === 1"
                                    title="Remover condição"
                                >
                                    <X :size="14" />
                                </button>
                            </div>
                        </div>
                        <p class="hint-text">Todas as condições acima devem ser verdadeiras para sugerir este tamanho.</p>
                    </div>

                </div>

                <div class="panel-footer">
                    <button class="btn-text" @click="closeForm">Cancelar</button>
                    <button class="btn-primary full" @click="handleSave">
                        <Save :size="18" /> Salvar Regra
                    </button>
                </div>
            </div>
        </transition>

    </div>
  </div>
</template>

<style scoped>
/* Layout Principal da View */
.page-container { max-width: 1200px; margin: 0 auto; position: relative; }

/* Header */
.page-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
}
.header-content { display: flex; align-items: center; gap: 16px; }
.btn-back {
    display: flex; align-items: center; gap: 6px; border: 1px solid #e2e8f0;
    background: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 500;
    transition: all 0.2s;
}
.btn-back:hover { background: #f1f5f9; color: #0f172a; }
.product-title { font-size: 1.5rem; color: #1e293b; margin: 0; font-weight: 700; }
.product-subtitle { color: #64748b; font-size: 0.9rem; margin: 0; }
.mono { font-family: 'Monaco', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }

/* Layout Grid (Lista + Painel) */
.rules-layout {
    display: flex; gap: 24px; align-items: flex-start; position: relative;
}

/* Lista de Regras */
.rules-list-container {
    flex: 1; min-width: 0; /* Previne overflow */
}

.rules-grid { display: flex; flex-direction: column; gap: 16px; }

.rule-card {
    background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s;
    position: relative; overflow: hidden;
}
.rule-card:hover { transform: translateY(-2px); box-shadow: 0 8px 12px rgba(0,0,0,0.05); }
.rule-card.active { border-color: var(--color-primary); background: #f8fafc; }

.rule-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }

.suggestion-badge {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: var(--color-primary); color: white; padding: 8px 16px; border-radius: 8px;
    min-width: 80px; text-align: center;
}
.suggestion-badge .label { font-size: 0.7rem; text-transform: uppercase; opacity: 0.9; }
.suggestion-badge .size { font-size: 1.4rem; font-weight: 800; line-height: 1; }

.priority-badge {
    background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
}

.actions { display: flex; gap: 8px; }
.icon-btn {
    width: 32px; height: 32px; border-radius: 6px; border: 1px solid transparent;
    display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; color: #94a3b8; transition: all 0.2s;
}
.icon-btn.edit:hover { background: #eff6ff; color: var(--color-primary); }
.icon-btn.delete:hover { background: #fef2f2; color: var(--color-error); }

.rule-conditions { display: flex; flex-wrap: wrap; gap: 8px; }
.condition-chip {
    display: flex; align-items: center; gap: 6px;
    background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 6px; font-size: 0.9rem; color: #334155;
}
.condition-chip .field { font-weight: 600; text-transform: capitalize; }
.condition-chip .operator { color: #94a3b8; font-weight: 700; font-family: monospace; }
.condition-chip .value { color: var(--color-primary); font-weight: 700; }

/* Empty State */
.empty-state {
    text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px dashed #e2e8f0;
}
.icon-circle {
    width: 64px; height: 64px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #94a3b8;
}
.empty-state h3 { color: #1e293b; margin-bottom: 8px; }
.empty-state p { color: #64748b; margin-bottom: 24px; }

/* Editor Panel (Lateral) */
.rule-editor-panel {
    width: 380px; background: white; border: 1px solid #e2e8f0; border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); position: sticky; top: 20px;
    display: flex; flex-direction: column; overflow: hidden;
}

.panel-header {
    padding: 16px 20px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
    display: flex; justify-content: space-between; align-items: center;
}
.panel-header h3 { font-size: 1.1rem; color: #1e293b; font-weight: 600; margin: 0; }
.close-btn { background: none; border: none; cursor: pointer; color: #94a3b8; }

.panel-body { padding: 20px; flex: 1; overflow-y: auto; max-height: calc(100vh - 180px); }

.form-section { margin-bottom: 24px; }
.form-section label { display: block; font-size: 0.85rem; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }

.row-inputs { display: flex; gap: 12px; }
.input-group { flex: 1; }
.input-label { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 4px; }
.input-lg {
    width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; font-weight: 600; color: #1e293b; text-align: center;
}
.input-lg:focus { border-color: var(--color-primary); outline: none; }

.separator { height: 1px; background: #e2e8f0; margin: 0 -20px 24px; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.btn-xs {
    display: flex; align-items: center; gap: 4px; padding: 4px 8px; font-size: 0.75rem; background: #eff6ff; color: var(--color-primary); border: none; border-radius: 4px; cursor: pointer; font-weight: 600;
}
.btn-xs:hover { background: #dbeafe; }

.condition-row {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
}
.cond-inputs {
    flex: 1; display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 6px; border-radius: 8px; border: 1px solid #e2e8f0;
}
.input-wrapper { position: relative; }
.field-select { flex: 2; }
.operator-select { flex: 1; min-width: 60px; }
.value-input { flex: 1; min-width: 60px; text-align: right; color: var(--color-primary); font-weight: 600; background: white !important; border: 1px solid #e2e8f0 !important; border-radius: 4px !important; padding: 4px 8px !important; }

.cond-inputs select {
    width: 100%; background: transparent; border: none; font-size: 0.9rem; padding: 4px 20px 4px 4px; outline: none; color: #334155; appearance: none; font-weight: 500; cursor: pointer;
}
.select-arrow { position: absolute; right: 0; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
.operator-select select { text-align: center; font-family: monospace; font-weight: 700; color: #64748b; padding-right: 14px; }

.btn-remove {
    background: transparent; border: none; color: #cbd5e1; cursor: pointer; padding: 4px; flex-shrink: 0;
}
.btn-remove:hover { color: var(--color-error); }
.btn-remove:disabled { opacity: 0; cursor: default; }

.hint-text { font-size: 0.8rem; color: #94a3b8; margin-top: 8px; font-style: italic; }

.panel-footer {
    padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc;
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
}
.btn-primary.full { flex: 1; justify-content: center; }

/* Animações */
.animate-up { animation: animate-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; transform: translateY(20px); }
.animate-in { animation: animate-in 0.3s ease forwards; opacity: 0; transform: scale(0.95); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes animate-up {
    to { opacity: 1; transform: translateY(0); }
}

@keyframes animate-in {
    to { opacity: 1; transform: scale(1); }
}

.slide-fade-enter-active, .slide-fade-leave-active { transition: all 0.3s ease; }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateX(20px); opacity: 0; }

.mobile-overlay {
    display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 90; backdrop-filter: blur(2px);
}

@media (max-width: 1024px) {
    .rules-layout { flex-direction: column; }
    .rule-editor-panel { width: 100%; position: fixed; bottom: 0; top: auto; left: 0; right: 0; border-radius: 16px 16px 0 0; z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.2); }
    .panel-body { max-height: 60vh; }
    .mobile-overlay { display: block; }
    .slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(100%); opacity: 1; }
}
</style>