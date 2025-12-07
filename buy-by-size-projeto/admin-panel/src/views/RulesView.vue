<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getProductRules, saveRule, deleteRule } from '@/api/apiService';
import {
    ArrowLeft, Plus, Save, Trash2, Edit2, X,
    AlertCircle, CheckCircle2, Ruler, ChevronRight
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
const produtoId = ref(route.params.produtoId);
const rules = ref([]);
const loading = ref(true);
const showForm = ref(false);
const isEditing = ref(false);
const message = ref('');
const errorMessage = ref('');
const currentRule = ref(null);

// --- LÓGICA ---
const newRuleState = () => ({
    produto_id: produtoId.value,
    condicoes: [{ campo: 'altura', operador: '>=', valor: '' }],
    sugestao_tamanho: '',
    prioridade: 10
});

const fetchRules = async () => {
    loading.value = true;
    try {
        rules.value = await getProductRules(produtoId.value);
    } catch (err) {
        errorMessage.value = 'Erro ao carregar regras.';
    } finally {
        loading.value = false;
    }
};

const openCreateForm = () => {
    currentRule.value = newRuleState();
    isEditing.value = false;
    showForm.value = true;
    message.value = ''; errorMessage.value = '';
};

const openEditForm = (rule) => {
    currentRule.value = JSON.parse(JSON.stringify(rule));
    isEditing.value = true;
    showForm.value = true;
    message.value = ''; errorMessage.value = '';
};

const closeForm = () => { showForm.value = false; currentRule.value = null; };

const addCondition = () => { currentRule.value.condicoes.push({ campo: 'peso', operador: '<', valor: '' }); };
const removeCondition = (index) => { currentRule.value.condicoes.splice(index, 1); };

const handleSave = async () => {
    message.value = ''; errorMessage.value = '';

    if (!currentRule.value.sugestao_tamanho) return errorMessage.value = 'Informe o Tamanho Sugerido.';

    const hasInvalid = currentRule.value.condicoes.some(c => c.valor === '' || c.valor === null);
    if (hasInvalid) return errorMessage.value = 'Preencha todos os valores das condições.';

    try {
        await saveRule(currentRule.value);
        message.value = isEditing.value ? 'Regra atualizada!' : 'Regra criada!';
        await fetchRules();
        setTimeout(closeForm, 1000);
    } catch (err) {
        errorMessage.value = err.response?.data?.error || 'Erro ao salvar.';
    }
};

const handleDelete = async (ruleId) => {
    if (!confirm('Excluir esta regra permanentemente?')) return;
    try { await deleteRule(ruleId); await fetchRules(); } catch (err) { alert('Erro ao excluir.'); }
};

// Utils visuais
const getFieldLabel = (val) => FIELDS.find(f => f.value === val)?.label || val;
const getOperatorLabel = (val) => {
    const op = OPERATORS.find(o => o.value === val);
    return op ? op.label.split('(')[0].trim() : val;
};

onMounted(fetchRules);
</script>

<template>
    <div class="page-container">

        <div class="page-header animate-up">
            <div class="header-left">
                <button class="btn-back" @click="router.back()">
                    <ArrowLeft :size="18" /> Voltar
                </button>
                <div class="title-group">
                    <h1>Regras de Medidas</h1>
                    <span class="product-badge">ID: {{ produtoId }}</span>
                </div>
            </div>
            <button class="btn-primary" @click="openCreateForm" :disabled="showForm">
                <Plus :size="18" /> Nova Regra
            </button>
        </div>

        <div class="content-layout">

            <div class="rules-list animate-up" style="animation-delay: 0.1s">

                <div v-if="loading" class="state-box">Carregando regras...</div>

                <div v-else-if="rules.length === 0" class="state-box empty">
                    <Ruler :size="40" class="icon-faded" />
                    <h3>Sem regras configuradas</h3>
                    <p>O sistema não consegue recomendar este produto sem regras.</p>
                    <button class="btn-outline" @click="openCreateForm">Criar Primeira Regra</button>
                </div>

                <div v-else class="rules-grid">
                    <div v-for="rule in rules" :key="rule.id" class="rule-card"
                        :class="{ 'editing': currentRule && currentRule.id === rule.id }">
                        <div class="card-content">
                            <div class="rule-conditions">
                                <span class="label-section">SE AS MEDIDAS FOREM:</span>
                                <div class="conditions-container">
                                    <div v-for="(cond, idx) in rule.condicoes" :key="idx" class="condition-badge">
                                        <span class="cond-field">{{ getFieldLabel(cond.campo) }}</span>
                                        <span class="cond-op">{{ getOperatorLabel(cond.operador) }}</span>
                                        <span class="cond-val">{{ cond.valor }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="rule-arrow">
                                <ChevronRight :size="24" />
                            </div>

                            <div class="rule-result">
                                <span class="label-section">SUGERIR:</span>
                                <div class="size-box">{{ rule.sugestao_tamanho }}</div>
                                <div class="priority-tag">Prioridade {{ rule.prioridade }}</div>
                            </div>
                        </div>

                        <div class="card-footer">
                            <button class="btn-action edit" @click="openEditForm(rule)">
                                <Edit2 :size="14" /> Editar
                            </button>
                            <button class="btn-action delete" @click="handleDelete(rule.id)">
                                <Trash2 :size="14" /> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <transition name="slide-in">
                <div v-if="showForm" class="editor-sidebar">
                    <div class="sidebar-header">
                        <h3>{{ isEditing ? 'Editar Regra' : 'Nova Regra' }}</h3>
                        <button class="close-icon" @click="closeForm">
                            <X :size="20" />
                        </button>
                    </div>

                    <div class="sidebar-content">

                        <div v-if="errorMessage" class="alert error">
                            <AlertCircle :size="16" /> {{ errorMessage }}
                        </div>
                        <div v-if="message" class="alert success">
                            <CheckCircle2 :size="16" /> {{ message }}
                        </div>

                        <div class="form-section highlight-section">
                            <label>Resultado Esperado</label>
                            <div class="result-inputs">
                                <div class="input-col">
                                    <span class="sub-label">Tamanho</span>
                                    <input v-model="currentRule.sugestao_tamanho" placeholder="Ex: M" class="input-big">
                                </div>
                                <div class="input-col">
                                    <span class="sub-label">Prioridade</span>
                                    <input type="number" v-model.number="currentRule.prioridade" class="input-big">
                                </div>
                            </div>
                        </div>

                        <div class="form-section">
                            <div class="section-top">
                                <label>Condições</label>
                                <button class="btn-small" @click="addCondition">
                                    <Plus :size="14" /> Adicionar
                                </button>
                            </div>

                            <div class="conditions-list-form">
                                <div v-for="(cond, index) in currentRule.condicoes" :key="index"
                                    class="condition-row-stacked">

                                    <div class="row-top">
                                        <span class="field-label-small">Campo de Medida</span>
                                        <div class="field-wrapper">
                                            <select v-model="cond.campo">
                                                <option v-for="f in FIELDS" :value="f.value">{{ f.label }}</option>
                                            </select>
                                            <button class="remove-btn" @click="removeCondition(index)"
                                                :disabled="currentRule.condicoes.length === 1">
                                                <Trash2 :size="14" />
                                            </button>
                                        </div>
                                    </div>

                                    <div class="row-bottom">
                                        <div class="half-col">
                                            <select v-model="cond.operador">
                                                <option v-for="op in OPERATORS" :value="op.value">{{ op.label }}
                                                </option>
                                            </select>
                                        </div>
                                        <div class="half-col">
                                            <input type="number" v-model.number="cond.valor"
                                                :placeholder="FIELDS.find(f => f.value === cond.campo)?.placeholder"
                                                :step="FIELDS.find(f => f.value === cond.campo)?.step">
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <p class="hint-text">Todas as condições devem ser verdadeiras.</p>
                        </div>

                    </div>

                    <div class="sidebar-footer">
                        <button class="btn-text" @click="closeForm">Cancelar</button>
                        <button class="btn-primary full" @click="handleSave">
                            <Save :size="18" /> {{ isEditing ? 'Salvar' : 'Criar Regra' }}
                        </button>
                    </div>
                </div>
            </transition>

        </div>
    </div>
</template>

<style scoped>
.page-container {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
}

/* HEADER */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.btn-back {
    display: flex;
    align-items: center;
    gap: 6px;
    background: white;
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    color: #64748b;
    font-weight: 500;
}

.btn-back:hover {
    background: #f8fafc;
    color: #0f172a;
}

.title-group h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.product-badge {
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #64748b;
    font-family: monospace;
}

.btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 4px 6px -1px rgba(0, 123, 255, 0.2);
}

.btn-primary:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

/* LAYOUT */
.content-layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
}

.rules-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* GRID DE REGRAS - Adicionado gap para separar cards */
.rules-grid {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

/* CARD DA REGRA */
.rule-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.rule-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-color: #cbd5e1;
}

.rule-card.editing {
    border: 2px solid var(--color-primary);
}

.card-content {
    display: flex;
    padding: 20px;
    align-items: stretch;
}

.rule-conditions {
    flex: 1;
}

.label-section {
    display: block;
    font-size: 0.7rem;
    font-weight: 700;
    color: #94a3b8;
    margin-bottom: 10px;
    letter-spacing: 0.05em;
}

.conditions-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.condition-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: #334155;
    background: #f8fafc;
    padding: 4px 8px;
    border-radius: 6px;
    width: fit-content;
}

.cond-field {
    font-weight: 600;
    text-transform: capitalize;
}

.cond-op {
    color: #64748b;
    font-weight: 500;
}

.cond-val {
    color: var(--color-primary);
    font-weight: 700;
}

.rule-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
    padding: 0 20px;
}

.rule-result {
    width: 140px;
    background: #f0f9ff;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
    border: 1px solid #e0f2fe;
}

.size-box {
    font-size: 2rem;
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: 4px;
}

.priority-tag {
    font-size: 0.75rem;
    color: #0369a1;
    font-weight: 600;
}

/* CARD FOOTER (BOTÕES) */
.card-footer {
    border-top: 1px solid #f1f5f9;
    padding: 10px 20px;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: #fcfcfc;
}

.btn-action {
    background: transparent;
    border: none;
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
}

.btn-action.edit {
    color: var(--color-primary);
}

.btn-action.edit:hover {
    background: #eff6ff;
}

.btn-action.delete {
    color: var(--color-error);
}

.btn-action.delete:hover {
    background: #fef2f2;
}

/* SIDEBAR DE EDIÇÃO */
.editor-sidebar {
    width: 700px;
    /* AUMENTADO: Largura maior para melhor conforto */
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 20px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 40px);
}

.sidebar-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.sidebar-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1e293b;
}

.close-icon {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
}

.sidebar-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.highlight-section {
    background: #f0f9ff;
    border: 1px solid #e0f2fe;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 24px;
}

.highlight-section label {
    color: #0369a1;
    font-weight: 700;
    margin-bottom: 8px;
    display: block;
    font-size: 0.85rem;
}

.result-inputs {
    display: flex;
    gap: 12px;
}

.input-col {
    flex: 1;
}

.sub-label {
    display: block;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 4px;
}

.input-big {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
    color: #0f172a;
}

.input-big:focus {
    border-color: var(--color-primary);
    outline: none;
}

.section-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.section-top label {
    font-weight: 700;
    font-size: 0.9rem;
    color: #334155;
}

.btn-small {
    background: #f1f5f9;
    border: none;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--color-primary);
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* FORMULÁRIO (STACKED) */
.conditions-list-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.condition-row-stacked {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 12px;
    border-radius: 8px;
}

.row-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.field-label-small {
    font-size: 0.75rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
}

.field-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
    width: 100%;
    justify-content: flex-end;
}

/* SELECTS ESTILIZADOS - APARÊNCIA UNIFICADA */
.field-wrapper select,
.half-col select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #334155;
    background-color: white;
    font-weight: 600;

    /* Remove a seta padrão e adiciona SVG customizado */
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
}

.field-wrapper select:focus,
.half-col select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.row-bottom {
    display: flex;
    gap: 8px;
}

.half-col {
    flex: 1;
}

.half-col input {
    width: 100%;
    padding: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.9rem;
    background: white;
}

.half-col input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.remove-btn {
    background: white;
    border: 1px solid #e2e8f0;
    color: #cbd5e1;
    cursor: pointer;
    padding: 5px;
    border-radius: 4px;
}

.remove-btn:hover {
    color: var(--color-error);
    border-color: #fca5a5;
}

.remove-btn:disabled {
    opacity: 0;
    cursor: default;
}

.hint-text {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-top: 15px;
    font-style: italic;
}

.sidebar-footer {
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    gap: 12px;
}

.btn-text {
    background: none;
    border: none;
    color: #64748b;
    font-weight: 500;
    cursor: pointer;
}

.full {
    flex: 1;
    justify-content: center;
}

.alert {
    padding: 10px;
    border-radius: 6px;
    font-size: 0.9rem;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.alert.error {
    background: #fef2f2;
    color: #b91c1c;
}

.alert.success {
    background: #f0fdf4;
    color: #166534;
}

.state-box {
    padding: 40px;
    text-align: center;
    color: #94a3b8;
}

.icon-faded {
    opacity: 0.3;
    margin-bottom: 10px;
}

.btn-outline {
    margin-top: 15px;
    border: 1px solid #e2e8f0;
    background: white;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
}

.animate-up {
    animation: fadeUp 0.4s ease-out forwards;
    opacity: 0;
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.slide-in-enter-active,
.slide-in-leave-active {
    transition: all 0.3s ease;
}

.slide-in-enter-from,
.slide-in-leave-to {
    transform: translateX(20px);
    opacity: 0;
}

/* MEDIA QUERIES (Mobile e Tablet) */
@media (max-width: 1024px) {
    .content-layout {
        flex-direction: column;
    }

    .editor-sidebar {
        width: 100%;
        position: fixed;
        bottom: 0;
        top: auto;
        left: 0;
        right: 0;
        border-radius: 16px 16px 0 0;
        z-index: 100;
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    }

    .sidebar-content {
        max-height: 60vh;
    }
}

@media (max-width: 640px) {

    /* Ajuste para inputs empilhados no mobile */
    .row-bottom {
        flex-direction: column;
        gap: 12px;
    }

    .half-col {
        width: 100%;
    }

    .card-content {
        flex-direction: column;
        gap: 16px;
    }

    .rule-arrow {
        display: none;
    }

    /* Oculta seta lateral no mobile */
    .rule-result {
        width: 100%;
        padding: 16px;
    }
}
</style>