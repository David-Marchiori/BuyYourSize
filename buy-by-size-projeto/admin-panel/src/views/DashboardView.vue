<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
// Importamos ambas as funções
import { getDashboardStats, getAnalyticsKPIs } from "@/api/apiService";
import {
  Shirt,
  AlertTriangle,
  Activity,
  TrendingUp,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from "lucide-vue-next";

const router = useRouter();
const loading = ref(true);

const kpis = ref({
  importedProducts: 0,
  configuredProducts: 0,
  missingRules: 0,
  recommendationsTotal: 0,
  recommendations24h: 0,
});

const attentionProducts = ref([]);
// Simulação de dados para o gráfico (Últimos 7 dias)
// A última posição recebe o dado real das últimas 24h
const chartData = ref([
  { day: "Seg", val: 0 },
  { day: "Ter", val: 0 },
  { day: "Qua", val: 0 },
  { day: "Qui", val: 0 },
  { day: "Sex", val: 0 },
  { day: "Sáb", val: 0 },
  { day: "Hoje", val: 0 },
]);

const fetchData = async () => {
  loading.value = true;
  try {
    // Carrega Catálogo e Analytics em paralelo
    const [catalogData, analyticsData] = await Promise.all([
      getDashboardStats().catch(() => ({
        kpis: { total: 0, configured: 0, missing: 0 },
        attention: [],
      })),
      getAnalyticsKPIs().catch(() => ({
        total_recomendacoes: 0,
        ultimas_24h: 0,
      })),
    ]);

    // 1. Popula KPIs do Catálogo
    kpis.value = {
      importedProducts: catalogData.kpis.total,
      configuredProducts: catalogData.kpis.configured,
      missingRules: catalogData.kpis.missing,
      recommendationsTotal: analyticsData.total_recomendacoes,
      recommendations24h: analyticsData.ultimas_24h,
    };

    // 2. Popula Lista de Atenção
    attentionProducts.value = catalogData.attention.map((p) => ({
      id: p.id,
      produto_id: p.produto_id,
      name: p.nome_regra || "Produto sem nome",
      reason: "Sem modelagem vinculada",
    }));

    // 3. Atualiza o Gráfico (Mockando dias anteriores, usando real no Hoje)
    // Para ficar visualmente bonito, geramos números aleatórios baixos nos dias anteriores
    // Em produção, você terá uma rota que retorna o array dos últimos 7 dias.
    const mockHistory = [2, 5, 3, 8, 4, 6];
    chartData.value = mockHistory.map((val, i) => ({
      day: chartData.value[i].day,
      val: val, // Valor fictício para histórico
    }));
    // O valor de HOJE é real
    chartData.value[6] = { day: "Hoje", val: analyticsData.ultimas_24h };
  } catch (err) {
    console.error("Erro dashboard:", err);
  } finally {
    loading.value = false;
  }
};

const resolveIssue = (sku) => {
  router.push({ name: "catalog", query: { q: sku } });
};

// Cálculo para altura das barras do gráfico (Normalização)
const getMaxVal = () => Math.max(...chartData.value.map((d) => d.val), 10); // Minimo 10 para escala
const getBarHeight = (val) => `${(val / getMaxVal()) * 100}%`;

onMounted(fetchData);
</script>

<template>
  <div class="dashboard-container">
    <div class="header-section animate-up">
      <div class="header-text">
        <h1>Visão Geral</h1>
        <p>Acompanhe o desempenho e a saúde do seu catálogo.</p>
      </div>
      <button class="btn-primary" @click="$router.push({ name: 'catalog' })">
        Gerenciar Catálogo
      </button>
    </div>

    <div v-if="loading" class="stats-grid">
      <div class="stat-card skeleton" v-for="i in 4" :key="i"></div>
    </div>

    <div v-else class="stats-grid">
      <div class="stat-card animate-up" style="animation-delay: 0.1s">
        <div class="stat-header">
          <div class="icon-box blue"><Shirt :size="22" /></div>
        </div>
        <div class="stat-content">
          <h3>{{ kpis.importedProducts }}</h3>
          <p>Produtos Importados</p>
        </div>
        <div class="stat-footer positive">
          <span>Total do catálogo</span>
        </div>
      </div>

      <div class="stat-card animate-up" style="animation-delay: 0.15s">
        <div class="stat-header">
          <div class="icon-box green"><CheckCircle2 :size="22" /></div>
        </div>
        <div class="stat-content">
          <h3>{{ kpis.configuredProducts }}</h3>
          <p>Configurados</p>
        </div>
        <div class="progress-container">
          <div
            class="progress-bar"
            :style="{
              width:
                (kpis.importedProducts > 0
                  ? (kpis.configuredProducts / kpis.importedProducts) * 100
                  : 0) + '%',
            }"
          ></div>
        </div>
      </div>

      <div class="stat-card warning animate-up" style="animation-delay: 0.2s">
        <div class="stat-header">
          <div class="icon-box orange"><AlertTriangle :size="22" /></div>
        </div>
        <div class="stat-content">
          <h3 class="text-warning">{{ kpis.missingRules }}</h3>
          <p>Sem Regras</p>
        </div>
        <div class="stat-footer negative" v-if="kpis.missingRules > 0">
          <span>Requer configuração</span>
        </div>
        <div class="stat-footer positive" v-else>
          <span>Tudo em dia!</span>
        </div>
      </div>

      <div
        class="stat-card highlight animate-up"
        style="animation-delay: 0.25s"
      >
        <div class="stat-header">
          <div class="icon-box purple"><Activity :size="22" /></div>
          <span class="trend-badge" v-if="kpis.recommendations24h > 0">
            <TrendingUp :size="14" /> +{{ kpis.recommendations24h }}
          </span>
        </div>
        <div class="stat-content">
          <h3 class="text-primary">{{ kpis.recommendationsTotal }}</h3>
          <p>Recomendações</p>
        </div>
        <div class="stat-footer">
          <span>Total acumulado</span>
        </div>
      </div>
    </div>

    <div class="main-layout-grid animate-up" style="animation-delay: 0.3s">
      <div class="card chart-card">
        <div class="card-header">
          <h3>Desempenho Semanal</h3>
          <div class="filter-box">
            <Calendar :size="14" />
            <span>Últimos 7 dias</span>
          </div>
        </div>

        <div class="chart-area">
          <div class="css-chart">
            <div v-for="(item, idx) in chartData" :key="idx" class="chart-col">
              <div class="bar-wrapper">
                <div class="bar-value" v-if="item.val > 0">{{ item.val }}</div>
                <div
                  class="bar"
                  :class="{ today: item.day === 'Hoje' }"
                  :style="{ height: getBarHeight(item.val) }"
                ></div>
              </div>
              <span class="bar-label">{{ item.day }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card attention-card">
        <div class="card-header">
          <h3>⚠️ Atenção Necessária</h3>
          <span class="badge-count">{{ attentionProducts.length }}</span>
        </div>

        <div v-if="attentionProducts.length === 0" class="empty-list">
          <CheckCircle2 :size="24" color="#22c55e" />
          <p>Tudo configurado nesta lista!</p>
        </div>

        <div v-else class="list-container">
          <div
            v-for="item in attentionProducts"
            :key="item.id"
            class="list-item"
            @click="resolveIssue(item.produto_id)"
          >
            <div class="item-icon-wrapper">
              <AlertTriangle :size="16" />
            </div>
            <div class="item-details">
              <strong>{{ item.name }}</strong>
              <span>{{ item.reason }}</span>
            </div>
            <ArrowRight :size="16" class="arrow-action" />
          </div>
        </div>

        <button
          v-if="attentionProducts.length > 0"
          class="btn-text"
          @click="router.push({ name: 'catalog' })"
        >
          Gerenciar no Catálogo
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animações e Layout Base */
.skeleton {
  background: #f1f5f9;
  height: 160px;
  border-radius: 16px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-up {
  opacity: 0;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}
.header-text h1 {
  font-size: 1.75rem;
  color: #1e293b;
  margin-bottom: 4px;
}
.header-text p {
  color: #64748b;
}

.btn-primary {
  padding: 10px 20px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 123, 255, 0.2);
}
.btn-primary:hover {
  background: #0069d9;
  transform: translateY(-1px);
}

/* KPI CARDS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  transition: all 0.3s ease;
  cursor: default;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}
.stat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-box.blue {
  background: #eff6ff;
  color: #3b82f6;
}
.icon-box.green {
  background: #f0fdf4;
  color: #22c55e;
}
.icon-box.orange {
  background: #fff7ed;
  color: #f97316;
}
.icon-box.purple {
  background: #faf5ff;
  color: #a855f7;
}

.stat-content h3 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 4px;
}
.stat-content p {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
}
.stat-footer {
  margin-top: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}
.stat-footer.positive {
  color: #22c55e;
}
.stat-footer.negative {
  color: #f97316;
}

.progress-container {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  margin-top: 20px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #22c55e;
  border-radius: 3px;
  transition: width 1s ease;
}

.trend-badge {
  background: #dcfce7;
  color: #166534;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* GRIDS PRINCIPAIS */
.main-layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.card-header h3 {
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 600;
}
.filter-box {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.8rem;
}

/* CHART AREA - CSS CHART */
.chart-area {
  height: 280px;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-top: 20px;
}
.css-chart {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  padding: 0 10px;
}
.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
  flex: 1;
  gap: 8px;
}
.bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
}
.bar {
  width: 100%;
  max-width: 40px;
  background: #e2e8f0;
  border-radius: 6px 6px 0 0;
  transition: height 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-height: 4px;
}
.bar:hover {
  background: #94a3b8;
}
.bar.today {
  background: var(--color-primary);
}
.bar.today:hover {
  background: #0069d9;
}
.bar-value {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px;
  animation: fadeIn 0.5s;
}
.bar-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* LISTA DE ATENÇÃO */
.badge-count {
  background: #fee2e2;
  color: #ef4444;
  padding: 2px 8px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
}
.empty-list {
  padding: 40px;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}
.list-item:hover {
  background: #f8fafc;
}
.list-item:last-child {
  border-bottom: none;
}
.item-icon-wrapper {
  background: #fef2f2;
  color: #ef4444;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.item-details strong {
  font-size: 0.9rem;
  color: #334155;
}
.item-details span {
  font-size: 0.8rem;
  color: #64748b;
}
.arrow-action {
  color: #cbd5e1;
  opacity: 0;
  transition: all 0.2s;
}
.list-item:hover .arrow-action {
  opacity: 1;
  transform: translateX(3px);
  color: var(--color-primary);
}
.btn-text {
  width: 100%;
  margin-top: 16px;
  padding: 10px;
  background: #f8fafc;
  border: none;
  border-radius: 8px;
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: 0.2s;
}
.btn-text:hover {
  background: #f1f5f9;
  color: var(--color-primary);
}

@media (max-width: 1024px) {
  .main-layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
