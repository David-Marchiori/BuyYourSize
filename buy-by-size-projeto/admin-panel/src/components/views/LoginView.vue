<template>
  <div class="login-container">
    <h2>Acesso ao Painel Admin</h2>
    
    <form @submit.prevent="handleLogin">
      <div class="input-group">
        <label for="email">E-mail</label>
        <input type="email" id="email" v-model="email" required>
      </div>

      <div class="input-group">
        <label for="password">Senha</label>
        <input type="password" id="password" v-model="password" required>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Carregando...' : 'Entrar' }}
      </button>
    </form>
    
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// Importa a instância do Supabase que configuramos
import { supabase } from '@/supabase'; 

// Variáveis reativas para o formulário e estado
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Para redirecionamento após o login
const router = useRouter();

async function handleLogin() {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    // Tenta fazer login com e-mail e senha
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error && error.message.includes('User not found')) {
      // Se o usuário não existe, podemos tentar cadastrar (com base na configuração do Supabase)
      await handleSignUp(); 
      return; 
    }

    if (error) {
      throw error;
    }

    // Se o login for bem-sucedido, redireciona para o dashboard
    successMessage.value = 'Login realizado com sucesso! Redirecionando...';
    // O nome da rota 'dashboard' será configurado no próximo passo
    router.push({ name: 'dashboard' }); 

  } catch (error) {
    // Captura e exibe qualquer outro erro
    errorMessage.value = error.message;
  } finally {
    loading.value = false;
  }
}

// Função auxiliar para cadastrar um novo usuário (se o login falhar por "User not found")
async function handleSignUp() {
    const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
    });

    if (error) {
        throw error; // Lança o erro para ser capturado no try/catch principal
    }

    // Supabase envia um e-mail de confirmação por padrão.
    // O usuário precisará clicar no link do e-mail antes de fazer login.
    successMessage.value = 'Cadastro realizado! Por favor, confirme seu e-mail e tente o login novamente.';
}
</script>

<style scoped>
/* Estilos básicos para o container de login */
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.input-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}
button:disabled {
  background-color: #90a4ae;
  cursor: not-allowed;
}
.error-message {
  color: red;
  margin-top: 15px;
}
.success-message {
  color: green;
  margin-top: 15px;
}
</style>