<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Shirt, AlertTriangle, Ruler, Activity, TrendingUp, 
  Calendar, ArrowRight, CheckCircle2, MoreHorizontal 
} from 'lucide-vue-next';

const router = useRouter();

// Dados Mock
const kpis = ref({
    importedProducts: 1245,
    configuredProducts: 980,
    missingRules: 265,
    totalRules: 1520,
    recommendationsLast30Days: '12.4K'
});

const attentionProducts = ref([
    { id: '1005', produto_id: 'SKU-1005', name: 'Calça Jeans Skinny - Azul', reason: 'Sem regra de medidas' },
    { id: '2010', produto_id: 'SKU-2010', name: 'Blusa de Tule Preto', reason: 'Sem categoria válida' },
    { id: '3500', produto_id: 'SKU-3500', name: 'Vestido Midi Floral', reason: 'Dados inconsistentes' },
]);
</script>

<template>
  <div class="dashboard-container">
    
    <div class="header-section animate-up">
      <div class="header-text">
        <h1>Bem-vindo, David! 👋</h1>
        <p>Visão geral do desempenho do seu provador hoje.</p>
      </div>
      <button class="btn-primary" @click="$router.push('/catalog')">
        Gerenciar Catálogo
      </button>
    </div>

    <div class="stats-grid">
      
      <div class="stat-card animate-up" style="animation-delay: 0.1s">
        <div class="stat-header">
          <div class="icon-box blue"><Shirt :size="22" /></div>
          <MoreHorizontal :size="18" class="more-icon" />
        </div>
        <div class="stat-content">
          <h3>{{ kpis.importedProducts }}</h3>
          <p>Produtos Importados</p>
        </div>
        <div class="stat-footer positive">
          <TrendingUp :size="14" /> <span>+12 novos hoje</span>
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
          <div class="progress-bar" style="width: 78%"></div>
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
        <div class="stat-footer negative">
          <span>Requer atenção imediata</span>
        </div>
      </div>

      <div class="stat-card highlight animate-up" style="animation-delay: 0.25s">
        <div class="stat-header">
          <div class="icon-box purple"><Activity :size="22" /></div>
        </div>
        <div class="stat-content">
          <h3 class="text-primary">{{ kpis.recommendationsLast30Days }}</h3>
          <p>Recomendações (30d)</p>
        </div>
        <div class="stat-footer positive">
          <TrendingUp :size="14" /> <span>+5.3% vs mês anterior</span>
        </div>
      </div>

    </div>

    <div class="main-layout-grid animate-up" style="animation-delay: 0.3s">
      
      <div class="card chart-card">
        <div class="card-header">
          <h3>Desempenho de Recomendações</h3>
          <div class="filter-box">
            <Calendar :size="14" />
            <select>
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
            </select>
          </div>
        </div>
        <div class="chart-area">
          <div class="chart-bars">
            <div class="bar" style="height: 40%"></div>
            <div class="bar" style="height: 60%"></div>
            <div class="bar" style="height: 45%"></div>
            <div class="bar active" style="height: 85%"></div>
            <div class="bar" style="height: 55%"></div>
            <div class="bar" style="height: 70%"></div>
            <div class="bar" style="height: 65%"></div>
          </div>
          <div class="chart-info">
             <p>Visualização de dados será integrada com Chart.js</p>
          </div>
        </div>
      </div>

      <div class="card attention-card">
        <div class="card-header">
          <h3>⚠️ Atenção Necessária</h3>
          <span class="badge-count">{{ attentionProducts.length }}</span>
        </div>
        <div class="list-container">
          <div 
            v-for="item in attentionProducts" 
            :key="item.id" 
            class="list-item"
            @click="router.push({ name: 'rules', params: { produtoId: item.produto_id } })"
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
        <button class="btn-text">Ver todos os problemas</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ANIMAÇÕES */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-up {
  opacity: 0;
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* LAYOUT GERAL */
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
.header-text h1 { font-size: 1.75rem; color: #1e293b; margin-bottom: 4px; }
.header-text p { color: #64748b; }

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
.btn-primary:hover { background: #0069d9; transform: translateY(-1px); }

/* GRID DE CARDS */
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
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  transition: all 0.3s ease;
  cursor: default;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
  border-color: #cbd5e1;
}

.stat-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
.icon-box {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}
.icon-box.blue { background: #eff6ff; color: #3b82f6; }
.icon-box.green { background: #f0fdf4; color: #22c55e; }
.icon-box.orange { background: #fff7ed; color: #f97316; }
.icon-box.purple { background: #faf5ff; color: #a855f7; }

.more-icon { color: #cbd5e1; cursor: pointer; }

.stat-content h3 { font-size: 1.8rem; font-weight: 700; color: #0f172a; line-height: 1; margin-bottom: 4px; }
.stat-content p { color: #64748b; font-size: 0.9rem; font-weight: 500; }

.stat-footer {
  margin-top: 16px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 4px;
}
.stat-footer.positive { color: #22c55e; }
.stat-footer.negative { color: #f97316; }

.progress-container { height: 6px; background: #f1f5f9; border-radius: 3px; margin-top: 20px; overflow: hidden; }
.progress-bar { height: 100%; background: #22c55e; border-radius: 3px; }

/* SEÇÃO PRINCIPAL */
.main-layout-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.card {
  background: white; border-radius: 16px; border: 1px solid #e2e8f0;
  padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.card-header h3 { font-size: 1.1rem; color: #1e293b; font-weight: 600; }

.filter-box {
  display: flex; align-items: center; gap: 6px;
  background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0; color: #64748b;
}
.filter-box select { border: none; background: transparent; font-size: 0.85rem; color: #475569; outline: none; }

/* Gráfico Visual */
.chart-area {
  height: 280px; position: relative;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.chart-bars {
  display: flex; align-items: flex-end; justify-content: space-between;
  height: 200px; padding: 0 10px;
}
.bar {
  width: 8%; background: #e2e8f0; border-radius: 6px 6px 0 0;
  transition: height 1s ease;
}
.bar.active { background: var(--color-primary); }
.chart-info { text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 10px; }

/* Lista de Atenção */
.badge-count {
  background: #fee2e2; color: #ef4444; padding: 2px 8px;
  border-radius: 99px; font-size: 0.75rem; font-weight: 700;
}

.list-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 10px;
  cursor: pointer; transition: background 0.2s;
  border-bottom: 1px solid #f1f5f9;
}
.list-item:hover { background: #f8fafc; }
.list-item:last-child { border-bottom: none; }

.item-icon-wrapper {
  background: #fef2f2; color: #ef4444;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.item-details { flex: 1; display: flex; flex-direction: column; }
.item-details strong { font-size: 0.9rem; color: #334155; }
.item-details span { font-size: 0.8rem; color: #64748b; }
.arrow-action { color: #cbd5e1; opacity: 0; transition: all 0.2s; }
.list-item:hover .arrow-action { opacity: 1; transform: translateX(3px); color: var(--color-primary); }

.btn-text {
  width: 100%; margin-top: 16px; padding: 10px;
  background: #f8fafc; border: none; border-radius: 8px;
  color: #64748b; font-weight: 500; font-size: 0.9rem; cursor: pointer;
  transition: 0.2s;
}
.btn-text:hover { background: #f1f5f9; color: var(--color-primary); }

/* RESPONSIVIDADE */
@media (max-width: 1024px) {
  .main-layout-grid { grid-template-columns: 1fr; }
}
</style>