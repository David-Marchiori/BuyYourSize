import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase' 
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import CatalogView from '@/views/CatalogView.vue'
import RulesView from '@/views/RulesView.vue'
import MainLayout from '@/components/MainLayout.vue';
import PlaceholderView from '@/views/PlaceholderView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView // Login fica fora do Layout
    },
    {
      // Rota principal que usa o MainLayout
      path: '/',
      component: MainLayout, // Componente pai que contém o menu e cabeçalho
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView 
        },
        {
          path: 'catalog',
          name: 'catalog',
          component: CatalogView
        },
        {
          path: 'rules/:produtoId', 
          name: 'rules',
          component: RulesView,
          props: true
        },
        { path: 'catalog-attention', component: PlaceholderView },
{ path: 'rules/create', component: PlaceholderView }, // Usaremos RulesView ou CatalogView/RulesView mais tarde
{ path: 'rules/list', component: PlaceholderView },
{ path: 'recommendations/how-it-works', component: PlaceholderView },
{ path: 'recommendations/logs', component: PlaceholderView },
{ path: 'widget/appearance', component: PlaceholderView },
{ path: 'integrations/feed', component: PlaceholderView },
{ path: 'integrations/ecommerce', component: PlaceholderView },
{ path: 'integrations/apikeys', component: PlaceholderView },
{ path: 'settings/store', component: PlaceholderView },
{ path: 'settings/domain', component: PlaceholderView },
{ path: 'billing/subscription', component: PlaceholderView },
{ path: 'billing/invoices', component: PlaceholderView },
      ]
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