import { createRouter, createWebHistory } from 'vue-router';
import { supabase } from '@/supabase'; // Importe o cliente Supabase direto

// Layouts
import MainLayout from '@/components/MainLayout.vue';

// Views
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import CatalogView from '@/views/CatalogView.vue';
import ModelingsView from '@/views/ModelingsView.vue';
import RulesView from '@/views/RulesView.vue';
import Feed from '@/integrations/Feed.vue';
import PlaceholderView from '@/views/PlaceholderView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 1. Rota de Login (PÚBLICA)
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false } // Explícito: Não precisa de senha
    },

    // 2. Área Administrativa (PRIVADA)
    {
      path: '/',
      component: MainLayout,
      // 🔒 O PULO DO GATO: Protege o pai e todos os filhos herdam!
      meta: { requiresAuth: true },
      children: [
        {
          path: '', // Rota raiz "/" redireciona para dashboard
          redirect: { name: 'dashboard' }
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView
        },
        // --- CATÁLOGO ---
        {
          path: 'catalog',
          name: 'catalog',
          component: CatalogView
        },
        {
          path: 'catalog-attention',
          name: 'catalog-attention',
          component: PlaceholderView
        },

        // --- MODELAGENS E REGRAS ---
        {
          path: 'modelings',
          name: 'Modelings',
          component: ModelingsView
        },
        {
          path: 'modelings/:id/rules',
          name: 'modeling-rules',
          component: RulesView,
          props: true
        },
        // Rotas legadas de regras (redirecionam ou mantém para compatibilidade)
        {
          path: 'rules/create',
          name: 'CreateRule',
          component: ModelingsView // Redireciona fluxo para modelagens
        },

        // --- SISTEMA ---
        {
          path: 'integrations/feed',
          name: 'Feed',
          component: Feed
        },

        // --- PLACEHOLDERS (Futuro) ---
        { path: 'recommendations/logs', component: PlaceholderView },
        { path: 'settings/store', component: PlaceholderView },
        { path: 'billing/subscription', component: PlaceholderView },
        { path: 'profile', component: PlaceholderView },
        { path: 'stores', component: PlaceholderView },
      ]
    },

    // 3. Captura qualquer rota desconhecida e joga pro login ou 404
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'dashboard' }
    }
  ]
});

// --- GUARDA DE NAVEGAÇÃO (SECURITY GUARD) ---
router.beforeEach(async (to, from, next) => {
  // 1. Verifica se a rota precisa de autenticação
  // to.matched.some verifica na rota atual e nos pais dela
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // 2. Obtém a sessão atual do usuário
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  // CASO 1: Tentando acessar área privada SEM estar logado
  if (requiresAuth && !session) {
    // Bloqueia e manda pro login
    next({ name: 'login' });
  }
  // CASO 2: Tentando acessar Login JÁ ESTANDO logado
  else if (to.name === 'login' && session) {
    // Manda direto pro dashboard (não faz sentido logar de novo)
    next({ name: 'dashboard' });
  }
  // CASO 3: Tudo certo, pode passar
  else {
    next();
  }
});

export default router;