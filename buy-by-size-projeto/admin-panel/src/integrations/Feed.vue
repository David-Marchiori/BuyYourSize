<script setup>
import { ref, onMounted } from 'vue';
import { 
  getStoreSettings, 
  saveStoreSettings, 
  syncCatalog, 
  getSyncHistory 
} from '@/api/apiService'; // Importando funções reais
import { 
  Save, RefreshCw, Server, CheckCircle2, AlertCircle, FileText 
} from 'lucide-vue-next';

// --- ESTADOS ---
const loading = ref(false);
const syncing = ref(false);
const pageLoading = ref(true);

// Dados do Formulário
const xmlUrl = ref('');
const frequency = ref('24');

// Dados de Logs
const lastSync = ref(null);
const syncHistory = ref([]);

// --- OPÇÕES ---
const FREQUENCIES = [
    { value: '6', label: 'A cada 6 horas' },
    { value: '12', label: 'A cada 12 horas' },
    { value: '24', label: 'Diariamente (24h)' },
    { value: '0', label: 'Manual (Apenas ao clicar)' },
];

// --- CARREGAMENTO INICIAL ---
const loadData = async () => {
    pageLoading.value = true;
    try {
        // 1. Carrega Configurações
        const settings = await getStoreSettings();
        if (settings) {
            xmlUrl.value = settings.xml_url || '';
            frequency.value = settings.update_frequency?.toString() || '24';
        }

        // 2. Carrega Histórico
        await refreshLogs();
        
    } catch (err) {
        console.error('Erro ao carregar dados:', err);
        alert('Erro ao carregar configurações.');
    } finally {
        pageLoading.value = false;
    }
};

const refreshLogs = async () => {
    try {
        const logs = await getSyncHistory();
        syncHistory.value = logs || [];
        if (logs && logs.length > 0) {
            lastSync.value = logs[0];
        }
    } catch (err) {
        console.error('Erro ao buscar logs', err);
    }
};

// --- AÇÕES ---

const handleSaveConfig = async () => {
    if (!xmlUrl.value) return alert('Insira uma URL válida.');
    
    loading.value = true;
    try {
        await saveStoreSettings({
            xml_url: xmlUrl.value,
            update_frequency: parseInt(frequency.value)
        });
        alert('Configurações salvas com sucesso!');
    } catch (err) {
        console.error(err);
        alert('Erro ao salvar configuração.');
    } finally {
        loading.value = false;
    }
};

const handleSyncNow = async () => {
    if (!xmlUrl.value) return alert('Salve uma URL válida primeiro.');
    
    syncing.value = true;
    try {
        // Chama a sincronização REAL usando a URL configurada
        await syncCatalog(xmlUrl.value);
        
        // Atualiza os logs para mostrar o sucesso
        await refreshLogs();
        alert('Sincronização concluída com sucesso!');
        
    } catch (err) {
        console.error(err);
        alert('Erro durante a sincronização: ' + (err.response?.data?.error || err.message));
        await refreshLogs(); // Atualiza log mesmo se falhar (se o backend gerar log de erro)
    } finally {
        syncing.value = false;
    }
};

// Formatação de Data
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
};

onMounted(loadData);
</script>

<template>
  <div class="page-container">
    
    <div class="page-header animate-up">
      <div class="header-left">
        <div class="icon-bg">
            <Server :size="24" color="var(--color-primary)" />
        </div>
        <div class="title-group">
            <h1>Integração de Catálogo</h1>
            <p>Gerencie a importação automática via XML (Google Shopping Feed)</p>
        </div>
      </div>
    </div>

    <div v-if="pageLoading" class="loading-state">
        <RefreshCw :size="32" class="spin" />
        <p>Carregando configurações...</p>
    </div>

    <div v-else class="content-grid animate-up" style="animation-delay: 0.1s">
        
        <div class="card config-card">
            <div class="card-header">
                <h3><FileText :size="18" /> Configuração do Feed</h3>
            </div>
            
            <div class="card-body">
                <div class="form-group">
                    <label>URL do XML do Catálogo</label>
                    <input 
                        v-model="xmlUrl" 
                        type="url" 
                        placeholder="https://loja.com.br/xml/google-shopping.xml"
                        class="input-field"
                    >
                    <span class="hint">Cole o link público do seu feed de produtos.</span>
                </div>

                <div class="form-group">
                    <label>Frequência de Atualização</label>
                    <div class="select-wrapper">
                        <select v-model="frequency" class="input-field">
                            <option v-for="freq in FREQUENCIES" :value="freq.value">
                                {{ freq.label }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <button class="btn-primary full-width" @click="handleSaveConfig" :disabled="loading">
                    <Save :size="18" /> {{ loading ? 'Salvando...' : 'Salvar Configuração' }}
                </button>
            </div>
        </div>

        <div class="right-column">
            
            <div class="card status-card">
                <div class="card-header">
                    <h3><RefreshCw :size="18" /> Status da Sincronização</h3>
                </div>
                <div class="card-body centered">
                    <div class="status-indicator" :class="syncing ? 'pulsing' : (lastSync?.status === 'success' ? 'success' : (lastSync ? 'error' : 'neutral'))">
                        <RefreshCw v-if="syncing" :size="32" class="spin" />
                        <CheckCircle2 v-else-if="lastSync?.status === 'success'" :size="32" />
                        <AlertCircle v-else-if="lastSync?.status === 'error'" :size="32" />
                        <Server v-else :size="32" /> </div>
                    
                    <div class="status-text">
                        <h4 v-if="syncing">Sincronizando...</h4>
                        <h4 v-else-if="lastSync">Última atualização: {{ formatDate(lastSync.created_at) }}</h4>
                        <h4 v-else>Nenhuma sincronização realizada</h4>

                        <p v-if="!syncing && lastSync">
                            {{ lastSync.status === 'success' ? (lastSync.details || 'Catálogo atualizado.') : 'Falha na última tentativa.' }}
                        </p>
                    </div>

                    <button class="btn-outline full-width" @click="handleSyncNow" :disabled="syncing">
                        {{ syncing ? 'Processando...' : 'Sincronizar Agora' }}
                    </button>
                </div>
            </div>

            <div class="history-list">
                <h4>Histórico Recente</h4>
                
                <div v-if="syncHistory.length === 0" class="empty-history">
                    <span class="text-muted">Sem logs recentes.</span>
                </div>

                <div v-for="log in syncHistory" :key="log.id" class="log-item">
                    <div class="log-icon" :class="log.status"></div>
                    <div class="log-info">
                        <span class="log-msg">{{ log.details || (log.status === 'success' ? 'Sucesso' : 'Erro') }}</span>
                        <span class="log-date">{{ formatDate(log.created_at) }}</span>
                    </div>
                </div>
            </div>

        </div>

    </div>
  </div>
</template>

<style scoped>

    .loading-state { padding: 40px; text-align: center; color: #64748b; }
.empty-history { padding: 10px; font-size: 0.85rem; color: #94a3b8; font-style: italic; }
.text-muted { color: #94a3b8; }
/* ... Restante do CSS igual ao enviado na resposta anterior ... */
.page-container { 
    max-width: 1000px; 
    margin: 0 auto; 
    padding: 20px;
    --color-primary: #2563eb; 
    --color-success: #16a34a;
    --color-error: #dc2626;
}
/* CORES GLOBAIS (Reutilizando as mesmas da tela de regras para consistência) */
.page-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    --color-primary: #2563eb;
    --color-success: #16a34a;
    --color-error: #dc2626;
}

/* HEADER */
.page-header {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.icon-bg {
    width: 48px;
    height: 48px;
    background: #eff6ff;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.title-group h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.title-group p {
    font-size: 0.9rem;
    color: #64748b;
    margin: 4px 0 0 0;
}

/* GRID LAYOUT */
.content-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 24px;
    align-items: start;
}

/* CARDS PADRÃO */
.card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    background: #fcfcfc;
}

.card-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #334155;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}

.card-body {
    padding: 24px;
}

.card-footer {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
}

/* FORMULÁRIO */
.form-group {
    margin-bottom: 20px;
}

.form-group:last-child {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
    font-size: 0.9rem;
}

.hint {
    font-size: 0.8rem;
    color: #94a3b8;
    display: block;
    margin-top: 6px;
}

.input-field {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.95rem;
    color: #1e293b;
    background: white;
    transition: all 0.2s;
}

.input-field:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Custom Select com SVG */
.select-wrapper select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.75rem center;
    background-repeat: no-repeat;
    background-size: 1.2em;
}

/* STATUS */
.status-card .centered {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.status-indicator {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.status-indicator.success {
    background: #dcfce7;
    color: var(--color-success);
}

.status-indicator.error {
    background: #fee2e2;
    color: var(--color-error);
}

.status-indicator.pulsing {
    background: #eff6ff;
    color: var(--color-primary);
}

.status-text h4 {
    margin: 0;
    color: #1e293b;
    font-size: 1rem;
}

.status-text p {
    margin: 4px 0 0 0;
    color: #64748b;
    font-size: 0.85rem;
}

/* HISTÓRICO */
.history-list {
    margin-top: 20px;
}

.history-list h4 {
    font-size: 0.85rem;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
}

.log-item {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #f1f5f9;
}

.log-icon {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.log-icon.success {
    background: var(--color-success);
    box-shadow: 0 0 0 3px #dcfce7;
}

.log-icon.error {
    background: var(--color-error);
    box-shadow: 0 0 0 3px #fee2e2;
}

.log-info {
    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
}

.log-msg {
    color: #334155;
    font-weight: 500;
}

.log-date {
    color: #94a3b8;
    font-size: 0.75rem;
}

/* BOTÕES */
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
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
}

.btn-primary:hover {
    background: #1d4ed8;
}

.btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-outline {
    background: transparent;
    border: 1px solid #cbd5e1;
    color: #475569;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
}

.btn-outline:hover {
    background: #f8fafc;
    border-color: #94a3b8;
}

.full-width {
    width: 100%;
}

.spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    100% {
        transform: rotate(360deg);
    }
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

/* RESPONSIVO */
@media (max-width: 768px) {
    .content-grid {
        grid-template-columns: 1fr;
    }

    .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }
}
</style>