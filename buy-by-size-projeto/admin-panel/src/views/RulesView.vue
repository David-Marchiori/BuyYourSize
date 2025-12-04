<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router'; // Para ler o parâmetro produto_id
import { getProductRules, saveRule, deleteRule } from '@/api/apiService';

// Tipos de operadores lógicos disponíveis para o lojista
const OPERATORS = [
    { value: '>=', label: 'Maior ou Igual a' },
    { value: '<=', label: 'Menor ou Igual a' },
    { value: '>', label: 'Maior que' },
    { value: '<', label: 'Menor que' },
    { value: '==', label: 'Igual a' },
];

const route = useRoute();
// Pegamos o produto_id da URL (Assumindo que você usará roteamento Vue)
const produtoId = ref(route.params.produtoId); 
const produtoNome = ref(''); // Para exibição
const rules = ref([]);
const loading = ref(true);
const currentRule = ref(null); // Regra sendo editada ou criada
const isEditing = ref(false);
const message = ref('');
const errorMessage = ref('');

// Estado inicial de uma nova condição
const newConditionState = () => ({
    campo: 'altura', // Default
    operador: '>=',  // Default
    valor: 0
});

// Estado inicial de uma nova regra
const newRuleState = () => ({
    produto_id: produtoId.value,
    condicoes: [newConditionState()], // Começa com 1 condição
    sugestao_tamanho: 'P',
    prioridade: 0
});

// --- Funções de API ---

const fetchRules = async () => {
    loading.value = true;
    errorMessage.value = '';
    try {
        // Supondo que você também passará o nome do produto na navegação
        // Por enquanto, buscamos apenas as regras
        const fetchedRules = await getProductRules(produtoId.value);
        rules.value = fetchedRules;
        if (fetchedRules.length > 0) {
            produtoNome.value = fetchedRules[0].nome_regra || 'Produto Sem Nome';
        }
    } catch (err) {
        errorMessage.value = 'Falha ao carregar regras. Verifique a API Key e o ID do produto.';
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const startCreate = () => {
    currentRule.value = newRuleState();
    isEditing.value = true;
};

const startEdit = (rule) => {
    // Clona a regra para evitar mutação direta antes de salvar
    currentRule.value = JSON.parse(JSON.stringify(rule)); 
    isEditing.value = true;
};

const addCondition = () => {
    currentRule.value.condicoes.push(newConditionState());
};

const removeCondition = (index) => {
    currentRule.value.condicoes.splice(index, 1);
};

const handleSaveRule = async () => {
    message.value = '';
    errorMessage.value = '';
    
    // Verificações simples de campos obrigatórios
    if (!currentRule.value.sugestao_tamanho || currentRule.value.condicoes.length === 0) {
        errorMessage.value = 'Preencha todos os campos obrigatórios.';
        return;
    }

    try {
        const action = currentRule.value.id ? 'Atualizada' : 'Criada';
        const result = await saveRule(currentRule.value);
        message.value = `Regra ${action} com sucesso!`;
        
        // Recarrega a lista e fecha o formulário
        await fetchRules();
        isEditing.value = false;
    } catch (err) {
        errorMessage.value = err.response?.data?.error || `Erro ao salvar regra.`;
    }
};

const handleDeleteRule = async (ruleId) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;
    
    message.value = '';
    errorMessage.value = '';
    try {
        await deleteRule(ruleId);
        message.value = 'Regra excluída com sucesso!';
        await fetchRules();
    } catch (err) {
        errorMessage.value = err.response?.data?.error || `Erro ao excluir regra.`;
    }
};

onMounted(fetchRules);
</script>

<template>
  <div class="rules-view">
    <button @click="$router.push('/catalog')" class="back-button">Voltar ao Catálogo</button>
    
    <h2>Gerenciar Regras para o Produto: {{ produtoId }}</h2>
    <p v-if="produtoNome">Nome: <strong>{{ produtoNome }}</strong></p>

    <div v-if="message" class="message-success">{{ message }}</div>
    <div v-if="errorMessage" class="message-error">{{ errorMessage }}</div>

    <div v-if="isEditing" class="rule-form">
      <h3>{{ currentRule.id ? 'Editar Regra' : 'Nova Regra' }}</h3>

      <div class="form-group">
        <label for="sugestao">Tamanho Sugerido:</label>
        <input id="sugestao" v-model="currentRule.sugestao_tamanho" placeholder="Ex: P, M, G, GG">
      </div>
      
      <div class="form-group">
        <label for="prioridade">Prioridade (Maior valor = Mais importante):</label>
        <input id="prioridade" type="number" v-model.number="currentRule.prioridade" min="0">
      </div>

      <h4>Condições (<button @click="addCondition">Adicionar Condição</button>)</h4>
      
      <div v-for="(cond, index) in currentRule.condicoes" :key="index" class="condition-row">
        
        <select v-model="cond.campo">
          <option value="altura">Altura (m)</option>
          <option value="peso">Peso (kg)</option>
          <option value="busto">Busto (cm)</option>
          </select>
        
        <select v-model="cond.operador">
          <option v-for="op in OPERATORS" :value="op.value">{{ op.label }}</option>
        </select>
        
        <input type="number" v-model.number="cond.valor" placeholder="Valor">
        
        <button @click="removeCondition(index)" :disabled="currentRule.condicoes.length === 1">Remover</button>
      </div>

      <div class="form-actions">
        <button @click="handleSaveRule">Salvar Regra</button>
        <button @click="isEditing = false" class="cancel-button">Cancelar</button>
      </div>
    </div>

    <div v-else class="rule-list">
      <button @click="startCreate" class="create-button">Criar Nova Regra</button>

      <div v-if="loading">Carregando regras...</div>
      <div v-else-if="rules.length === 0">
        Nenhuma regra cadastrada para este produto. Clique em "Criar Nova Regra".
      </div>
      <div v-else>
        <h3>Regras Ativas (Ordem de Prioridade)</h3>
        <ul class="rules-ul">
          <li v-for="rule in rules" :key="rule.id" class="rule-item">
            <p><strong>Sugestão: {{ rule.sugestao_tamanho }}</strong> (Prioridade: {{ rule.prioridade }})</p>
            <p class="rule-logic">
              <span v-for="(cond, index) in rule.condicoes" :key="index">
                SE {{ cond.campo }} {{ cond.operador }} {{ cond.valor }}
                <span v-if="index < rule.condicoes.length - 1"> E </span>
              </span>
            </p>
            <div class="rule-actions">
              <button @click="startEdit(rule)">Editar</button>
              <button @click="handleDeleteRule(rule.id)" class="delete-button">Excluir</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos básicos para o CRUD de regras */
.rule-form, .rule-list { margin-top: 20px; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
.form-group { margin-bottom: 15px; }
.condition-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
.condition-row select, .condition-row input { padding: 8px; }
.rules-ul { list-style: none; padding: 0; }
.rule-item { border: 1px solid #ccc; padding: 15px; margin-bottom: 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
.rule-logic { font-style: italic; color: #555; font-size: 0.9em; }
.rule-actions button { margin-left: 10px; padding: 5px 10px; }
.create-button { background-color: #28a745; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
.delete-button { background-color: #dc3545; color: white; }
.cancel-button { background-color: #6c757d; color: white; }
</style>