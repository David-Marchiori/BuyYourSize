import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase' 
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import CatalogView from '@/views/CatalogView.vue'
import RulesView from '@/views/RulesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      // ESTA FLAG DIZ: "Esta rota PRECISA de autenticação"
      meta: { requiresAuth: true } 
    },
    {
      path: '/catalog',
      name: 'catalog',
      component: CatalogView
    },
    {
      // Rota dinâmica para gerenciar regras de um produto
      path: '/rules/:produtoId', 
      name: 'rules',
      component: RulesView,
      props: true // Permite passar produtoId como prop se preferir
    }
  ]
})

// --- GUARDA DE NAVEGAÇÃO GLOBAL ---
// Esta função será executada ANTES de cada tentativa de navegação de rota.
router.beforeEach(async (to, from, next) => {
  // 1. Verifica se a rota para onde estamos indo exige autenticação
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  // 2. Se a rota exige autenticação, checamos o status do usuário
  if (requiresAuth) {
    // Pede ao Supabase a sessão do usuário atual.
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user; // Supabase retorna session?.user se logado
    
    if (!user) {
      // Se NÃO houver usuário (não logado), redireciona para a tela de login
      next({ name: 'login' });
    } else {
      // Se houver usuário (logado), a navegação é permitida
      next();
    }
  } else {
    // Se a rota NÃO exige autenticação (ex: /login), a navegação é sempre permitida
    next();
  }
});

export default router