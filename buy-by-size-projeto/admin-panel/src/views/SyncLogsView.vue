<script setup>
import { ref, onMounted } from 'vue';
import { getSyncLogs } from '@/api/apiService';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-vue-next';

const logs = ref([]);
const loading = ref(true);

const fetchLogs = async () => {
    loading.value = true;
    try {
        logs.value = await getSyncLogs();
    } catch (err) {
        console.error(err);
    } finally {
        loading.value = false;
    }
};

const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('pt-BR');
};

onMounted(fetchLogs);
</script>

<template>
    <div class="page-container">
        
        <div class="header-row">
            <div class="header-text">
                <h1>Histórico de Sincronização</h1>
                <p>Acompanhe o status e os resultados da importação do seu catálogo via XML.</p>
            </div>
        </div>

        <div v-if="loading" class="state-msg">
            <div class="spinner"></div> Carregando logs...
        </div>

        <div v-else-if="logs.length === 0" class="state-msg empty">
             <Clock :size="48" class="icon-faded"/>
             <h3>Nenhuma sincronização registrada.</h3>
             <p>Realize sua primeira sincronização XML para ver o histórico aqui.</p>
        </div>

        <div v-else class="logs-table-card">
            <table class="modern-table">
                <thead>
                    <tr>
                        <th width="15%">Data</th>
                        <th width="10%">Status</th>
                        <th width="75%">Detalhes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="log in logs" :key="log.id">
                        <td>{{ formatTime(log.created_at) }}</td>
                        <td>
                            <span :class="['status-tag', log.status]">
                                <CheckCircle2 v-if="log.status === 'success'" :size="14"/>
                                <AlertTriangle v-else :size="14"/>
                                {{ log.status === 'success' ? 'Sucesso' : 'Erro' }}
                            </span>
                        </td>
                        <td>{{ log.details }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
/* Adicionar estilos como .status-tag.success { cor verde } e .status-tag.error { cor vermelha } */
.status-tag { 
    display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.8rem;
}
.status-tag.success { background: #dcfce7; color: #166534; }
.status-tag.error { background: #fef2f2; color: #b91c1c; }
/* Usar os estilos de tabela e state-msg que você já tem em outros componentes */
</style>