<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { 
  Search, Bell, User, LogOut, Store, Settings, CreditCard, 
  Home, Shirt, Ruler, BarChart2, Layers, Link as LinkIcon, 
  Menu, X, ChevronRight 
} from 'lucide-vue-next';

const route = useRoute();
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};
</script>

<template>
  <div class="main-container">
    
    <div 
      class="mobile-overlay" 
      :class="{ 'is-open': isMobileMenuOpen }" 
      @click="closeMobileMenu"
    ></div>

    <header class="topbar">
      <div class="topbar-left">
        <button class="mobile-toggle" @click="toggleMobileMenu">
          <Menu :size="24" />
        </button>
        
        <div class="logo">
           <Layers :size="24" class="logo-icon" /> 
           <span>Buy Your Size</span>
        </div>
      </div>

      <div class="topbar-center">
        <div class="quick-search">
          <Search class="search-icon" :size="18" />
          <input type="text" placeholder="Buscar..." />
        </div>
      </div>

      <div class="topbar-right">
        <button class="icon-btn" title="Notificações">
          <Bell :size="20" />
          <span class="notification-pulse"></span>
        </button>
        
        <div class="profile-menu-container">
          <button class="profile-btn">
            <span>DM</span> 
          </button>
          
          <div class="profile-dropdown">
            <div class="dropdown-header">
              <p class="profile-name">David Marchiori</p>
              <span class="profile-email">david@exemplo.com</span>
            </div>
            <div class="dropdown-body">
              <RouterLink to="/profile" class="dropdown-item"><User :size="16" /> Meu Perfil</RouterLink>
              <RouterLink to="/stores" class="dropdown-item"><Store :size="16" /> Minhas Lojas</RouterLink>
              <RouterLink to="/preferences" class="dropdown-item"><Settings :size="16" /> Preferências</RouterLink>
              <div class="separator"></div>
              <button class="dropdown-item logout" @click="$router.push('/login')">
                <LogOut :size="16" /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="content-wrapper">
      <aside class="sidebar" :class="{ 'is-open': isMobileMenuOpen }">
        
        <div class="sidebar-header-mobile">
          <span class="logo-text">Menu</span>
          <button class="close-btn" @click="closeMobileMenu"><X :size="20" /></button>
        </div>

        <nav class="sidebar-nav">
          
          <RouterLink to="/dashboard" class="nav-item" @click="closeMobileMenu">
            <Home :size="20" /> <span class="nav-text">Dashboard</span>
          </RouterLink>

          <span class="menu-label">Catálogo</span>
          <RouterLink to="/catalog" class="nav-item" @click="closeMobileMenu">
            <Shirt :size="20" /> <span class="nav-text">Produtos Importados</span>
          </RouterLink>
          <RouterLink to="/catalog-attention" class="nav-item" @click="closeMobileMenu">
             <span class="dot-warning"></span> <span class="nav-text">Atenção Necessária</span>
          </RouterLink>

          <span class="menu-label">Regras</span>
          <RouterLink to="/rules/create" class="nav-item" @click="closeMobileMenu">
            <Ruler :size="20" /> <span class="nav-text">Criar Regra</span>
          </RouterLink>
          <RouterLink to="/rules/list" class="nav-item" @click="closeMobileMenu">
             <span class="nav-indent">Minhas Regras</span>
          </RouterLink>

          <span class="menu-label">Inteligência</span>
          <RouterLink to="/recommendations/logs" class="nav-item" @click="closeMobileMenu">
            <BarChart2 :size="20" /> <span class="nav-text">Logs & Analytics</span>
          </RouterLink>

          <span class="menu-label">Sistema</span>
          <RouterLink to="/integrations/feed" class="nav-item" @click="closeMobileMenu">
            <LinkIcon :size="20" /> <span class="nav-text">Integrações XML</span>
          </RouterLink>
          <RouterLink to="/settings/store" class="nav-item" @click="closeMobileMenu">
            <Settings :size="20" /> <span class="nav-text">Configurações</span>
          </RouterLink>

          <div class="sidebar-footer">
            <RouterLink to="/billing/subscription" class="plan-card">
              <div class="plan-info">
                <span class="plan-name">Plano Pro</span>
                <span class="plan-status">Ativo</span>
              </div>
              <ChevronRight :size="16" class="plan-arrow" />
            </RouterLink>
          </div>

        </nav>
      </aside>

      <main class="main-content">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Variáveis de Animação e Tamanho */
:root {
  --sidebar-width: 260px;
  --topbar-height: 64px;
  --transition-speed: 0.3s;
}

.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8fafc; /* Slate-50: Fundo mais moderno */
}

/* ----------------------------------- */
/* TOPBAR MODERNIZADO */
/* ----------------------------------- */
.topbar {
  height: var(--topbar-height);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px); /* Efeito vidro */
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
  transition: all var(--transition-speed);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mobile-toggle {
  display: none; /* Escondido no desktop */
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

.quick-search {
  position: relative;
  width: 100%;
  max-width: 400px;
}
.quick-search input {
  width: 100%;
  background: #f1f5f9;
  border: 1px solid transparent;
  padding: 10px 10px 10px 40px;
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.quick-search input:focus {
  background: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1);
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

/* Ícones do Topbar */
.icon-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 50%;
  color: #64748b;
  cursor: pointer;
  transition: background 0.2s;
}
.icon-btn:hover {
  background-color: #f1f5f9;
  color: var(--color-primary);
}
.notification-pulse {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: var(--color-error);
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

/* Profile Dropdown com Animação */
.profile-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary), #3b82f6);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 123, 255, 0.2);
  transition: transform 0.2s;
}
.profile-btn:hover { transform: scale(1.05); }

.profile-menu-container { position: relative; }
.profile-menu-container:hover .profile-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
.profile-dropdown {
  position: absolute;
  top: 50px;
  right: 0;
  width: 240px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.dropdown-header {
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.profile-name { font-weight: 600; color: #334155; font-size: 0.95rem; }
.profile-email { font-size: 0.8rem; color: #94a3b8; }
.dropdown-body { padding: 8px; }
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: #475569;
  text-decoration: none;
  font-size: 0.9rem;
  border-radius: 8px;
  transition: all 0.2s;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}
.dropdown-item:hover { background: #f1f5f9; color: var(--color-primary); }
.dropdown-item.logout { color: var(--color-error); }
.dropdown-item.logout:hover { background: #fef2f2; }
.separator { height: 1px; background: #e2e8f0; margin: 6px 0; }

/* ----------------------------------- */
/* SIDEBAR & RESPONSIVIDADE */
/* ----------------------------------- */
.content-wrapper { display: flex; flex: 1; position: relative; }

.sidebar {
  width: var(--sidebar-width);
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--topbar-height));
  position: sticky;
  top: var(--topbar-height);
  overflow-y: auto;
  transition: transform var(--transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 40;
}

.sidebar-header-mobile { display: none; }

.sidebar-nav { padding: 20px 16px; flex: 1; }

.menu-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin: 24px 12px 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  color: #64748b;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 2px;
  font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover { background: #f8fafc; color: #0f172a; }
.nav-item.router-link-active {
  background: #eff6ff;
  color: var(--color-primary);
}

.dot-warning {
  width: 8px; height: 8px; background: #f59e0b; border-radius: 50%; display: inline-block;
}
.nav-indent { margin-left: 28px; }

/* Rodapé do Sidebar (Plano) */
.sidebar-footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}
.plan-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
}
.plan-card:hover { border-color: var(--color-primary); background: #fff; }
.plan-name { display: block; font-weight: 600; font-size: 0.9rem; color: #334155; }
.plan-status { font-size: 0.75rem; color: var(--color-success); font-weight: 500; }
.plan-arrow { color: #94a3b8; }

/* MAIN CONTENT */
.main-content {
  flex: 1;
  padding: 32px;
  max-width: 100%;
  overflow-x: hidden;
}

/* 📱 RESPONSIVIDADE (Mobile & Tablet) */
@media (max-width: 1024px) {
  .topbar-center { display: none; } /* Esconde busca no mobile para economizar espaço */
  
  .mobile-toggle { display: block; margin-right: 10px; }
  
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%); /* Esconde por padrão */
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
  }
  
  .sidebar.is-open { transform: translateX(0); }

  .sidebar-header-mobile {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
  }
  .close-btn { background: none; border: none; color: #64748b; font-size: 1.5rem; }

  /* Overlay */
  .mobile-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 30;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
    backdrop-filter: blur(2px);
  }
  .mobile-overlay.is-open { opacity: 1; visibility: visible; }
  
  .main-content { padding: 20px; }
}

/* Animação de Entrada de Rota */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>