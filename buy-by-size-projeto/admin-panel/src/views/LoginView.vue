<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase'; 
import { Mail, Lock, Eye, EyeOff, Loader2, Layers, ArrowRight } from 'lucide-vue-next';

// Estados do Formulário
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const router = useRouter();

// Alternar visibilidade da senha
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// Lógica de Login (Mantendo a mesma lógica funcional, melhorando a UX)
async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Por favor, preencha todos os campos.';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;

    // Redireciona para o Dashboard com animação de saída (opcional)
    router.push({ name: 'dashboard' }); 

  } catch (error) {
    // Tratamento de erros mais amigável
    if (error.message.includes('Invalid login')) {
        errorMessage.value = 'E-mail ou senha incorretos.';
    } else {
        errorMessage.value = error.message;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="background-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
    </div>

    <div class="login-container animate-enter">
      
      <div class="login-header">
        <div class="logo-circle">
          <Layers :size="28" color="#fff" />
        </div>
        <h1>Bem-vindo de volta!</h1>
        <p>Acesse o painel do <strong>Buy Your Size</strong> para gerenciar suas regras.</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        
        <div v-if="errorMessage" class="alert-error">
            {{ errorMessage }}
        </div>

        <div class="input-group">
          <label for="email">E-mail corporativo</label>
          <div class="input-wrapper">
            <Mail :size="18" class="input-icon left" />
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="ex: nome@suaempresa.com" 
              required
              autocomplete="email"
            >
          </div>
        </div>

        <div class="input-group">
          <div class="label-row">
            <label for="password">Senha</label>
            <a href="#" class="forgot-link">Esqueceu a senha?</a>
          </div>
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon left" />
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              placeholder="Digite sua senha" 
              required
              autocomplete="current-password"
            >
            <button type="button" class="toggle-password" @click="togglePassword">
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="!loading" class="btn-content">
            Entrar no Painel <ArrowRight :size="18" />
          </span>
          <span v-else class="btn-content">
            <Loader2 :size="20" class="spinner" /> Verificando...
          </span>
        </button>

      </form>

      <div class="login-footer">
        <p>Ainda não tem uma conta? <a href="#">Fale com o suporte</a></p>
      </div>
    </div>
    
    <div class="footer-copy">
      © 2025 Buy Your Size. Todos os direitos reservados.
    </div>
  </div>
</template>

<style scoped>
/* ---------------------------------- */
/* Layout Geral */
/* ---------------------------------- */
.login-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

/* Background Abstrato */
.background-shapes .shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
}
.shape-1 {
  width: 400px; height: 400px;
  background: #bfdbfe; /* Azul claro */
  top: -100px; left: -100px;
}
.shape-2 {
  width: 300px; height: 300px;
  background: #ddd6fe; /* Roxo claro */
  bottom: -50px; right: -50px;
}

/* Container do Login */
.login-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
  border: 1px solid #fff;
  z-index: 10;
  margin: 20px;
}

/* Animação de Entrada */
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-enter {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ---------------------------------- */
/* Header */
/* ---------------------------------- */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.logo-circle {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, var(--color-primary), #2563eb);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}
.login-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}
.login-header p {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* ---------------------------------- */
/* Formulário */
/* ---------------------------------- */
.login-form {
  display: flex; flex-direction: column; gap: 20px;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 6px;
}

.label-row {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;
}
.forgot-link {
  font-size: 0.8rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}
.forgot-link:hover { text-decoration: underline; }

/* Inputs com Ícones */
.input-wrapper {
  position: relative;
  display: flex; align-items: center;
}
.input-wrapper input {
  width: 100%;
  padding: 12px 40px; /* Espaço para ícones */
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
}
.input-wrapper input:focus {
  background: #fff;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1);
}

.input-icon {
  position: absolute;
  color: #94a3b8;
}
.input-icon.left { left: 12px; }

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  padding: 0;
}
.toggle-password:hover { color: #475569; }

/* Botão de Login */
.btn-login {
  margin-top: 10px;
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(0, 123, 255, 0.25);
}
.btn-login:hover:not(:disabled) {
  background: #0069d9;
  transform: translateY(-1px);
}
.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-content {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

/* Spinner */
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Alertas */
.alert-error {
  background: #fef2f2;
  color: #b91c1c;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  border: 1px solid #fecaca;
  display: flex; align-items: center;
}

/* ---------------------------------- */
/* Footer */
/* ---------------------------------- */
.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}
.login-footer a {
  color: var(--color-text-main);
  font-weight: 600;
  text-decoration: none;
}
.login-footer a:hover { color: var(--color-primary); }

.footer-copy {
  margin-top: 30px;
  font-size: 0.75rem;
  color: #94a3b8;
  z-index: 10;
}

/* Responsividade */
@media (max-width: 480px) {
  .login-container { padding: 30px 20px; }
}
</style>