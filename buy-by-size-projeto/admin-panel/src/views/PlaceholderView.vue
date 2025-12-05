<script setup>
import { useRoute, useRouter } from 'vue-router';
import { Construction, ArrowLeft } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

// Mapeamento opcional de títulos baseados na rota para ficar mais bonito
const getTitle = () => {
  const path = route.path;
  if (path.includes('billing')) return 'Faturamento e Planos';
  if (path.includes('settings')) return 'Configurações da Loja';
  if (path.includes('integrations')) return 'Integrações';
  if (path.includes('widget')) return 'Personalização do Widget';
  if (path.includes('recommendations')) return 'Inteligência e Logs';
  return 'Em Desenvolvimento';
};
</script>

<template>
  <div class="placeholder-view">
    <div class="content-box">
      <div class="icon-wrapper">
        <Construction :size="48" color="#f59e0b" />
      </div>
      
      <h1>{{ getTitle() }}</h1>
      
      <p class="description">
        Esta funcionalidade faz parte do roadmap do <strong>Buy Your Size</strong> e estará disponível em breve.
      </p>
      
      <div class="debug-info">
        Rota técnica: <code>{{ route.path }}</code>
      </div>

      <button @click="router.back()" class="btn-back">
        <ArrowLeft :size="16" /> Voltar
      </button>
    </div>
  </div>
</template>

<style scoped>
.placeholder-view {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%; /* Ocupa a altura disponível do main-content */
  min-height: 60vh;
}

.content-box {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  border: 1px solid #f3f4f6;
  max-width: 500px;
  width: 100%;
}

.icon-wrapper {
  background-color: #fffbeb;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

h1 {
  color: var(--color-text-main);
  margin-bottom: 10px;
  font-size: 1.5em;
}

.description {
  color: var(--color-text-light);
  margin-bottom: 25px;
  line-height: 1.5;
}

.debug-info {
  background-color: #f9fafb;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.85em;
  color: #6b7280;
  margin-bottom: 25px;
  border: 1px dashed #e5e7eb;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: var(--color-text-main);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}
</style>