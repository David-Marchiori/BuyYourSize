<script setup>
import { ref } from 'vue';
import {
    Save, RefreshCw, Server, Clock,
    CheckCircle2, AlertCircle, FileText
} from 'lucide-vue-next';

// --- ESTADOS ---
const loading = ref(false);
const syncing = ref(false);
const xmlUrl = ref('');
const frequency = ref('24'); // Horas
const lastSync = ref({ date: '06/12/2025 14:30', status: 'success', total: 142 });

const syncHistory = ref([
    { id: 1, date: '06/12/2025 14:30', status: 'success', msg: '142 produtos atualizados' },
    { id: 2, date: '05/12/2025 14:30', status: 'success', msg: '140 produtos atualizados' },
    { id: 3, date: '04/12/2025 14:30', status: 'error', msg: 'Timeout na conexão' },
]);

// --- OPÇÕES ---
const FREQUENCIES = [
    { value: '6', label: 'A cada 6 horas' },
    { value: '12', label: 'A cada 12 horas' },
    { value: '24', label: 'Diariamente (24h)' },
    { value: '0', label: 'Manual (Apenas ao clicar)' },
];

// --- AÇÕES ---
const handleSaveConfig = async () => {
    loading.value = true;
    // Simulação de salvamento no Supabase
    setTimeout(() => {
        loading.value = false;
        alert('Configurações salvas!');
    }, 1000);
};

const handleSyncNow = async () => {
    if (!xmlUrl.value) return alert('Insira uma URL válida primeiro.');

    syncing.value = true;
    // Simulação de request para o Backend processar o XML
    setTimeout(() => {
        syncing.value = false;
        lastSync.value = { date: 'Agora', status: 'success', total: 150 };
        syncHistory.value.unshift({
            id: Date.now(),
            date: 'Agora',
            status: 'success',
            msg: 'Sincronização manual concluída'
        });
    }, 2000);
};
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

        <div class="content-grid animate-up" style="animation-delay: 0.1s">

            <div class="card config-card">
                <div class="card-header">
                    <h3>
                        <FileText :size="18" /> Configuração do Feed
                    </h3>
                </div>

                <div class="card-body">
                    <div class="form-group">
                        <label>URL do XML do Catálogo</label>
                        <input v-model="xmlUrl" type="url" placeholder="https://loja.com.br/xml/google-shopping.xml"
                            class="input-field">
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
                        <h3>
                            <RefreshCw :size="18" /> Status da Sincronização
                        </h3>
                    </div>
                    <div class="card-body centered">
                        <div class="status-indicator" :class="syncing ? 'pulsing' : lastSync.status">
                            <RefreshCw v-if="syncing" :size="32" class="spin" />
                            <CheckCircle2 v-else-if="lastSync.status === 'success'" :size="32" />
                            <AlertCircle v-else :size="32" />
                        </div>

                        <div class="status-text">
                            <h4 v-if="syncing">Sincronizando...</h4>
                            <h4 v-else>Última atualização: {{ lastSync.date }}</h4>
                            <p v-if="!syncing">{{ lastSync.status === 'success' ? 'Catálogo atualizado com sucesso.' :
                                'Falha na última tentativa.' }}</p>
                        </div>

                        <button class="btn-outline full-width" @click="handleSyncNow" :disabled="syncing">
                            {{ syncing ? 'Processando...' : 'Sincronizar Agora' }}
                        </button>
                    </div>
                </div>

                <div class="history-list">
                    <h4>Histórico Recente</h4>
                    <div v-for="log in syncHistory" :key="log.id" class="log-item">
                        <div class="log-icon" :class="log.status"></div>
                        <div class="log-info">
                            <span class="log-msg">{{ log.msg }}</span>
                            <span class="log-date">{{ log.date }}</span>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </div>
</template>

<style scoped>
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