<template>
  <div>
    <h1>🎉 Bem-vindo ao Painel de Admin Buy by Size!</h1>
    <p>Você acessou esta página com sucesso. Isso significa que a autenticação funcionou.</p>
    <button @click="handleLogout">Sair / Logout</button>
  </div>
</template>

<script setup>
import { supabase } from '@/supabase'; 
import { useRouter } from 'vue-router';

const router = useRouter();

// Função para fazer logout
async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    // Redireciona para a tela de login após o logout
    router.push({ name: 'login' }); 
  } else {
    console.error('Erro ao fazer logout:', error.message);
  }
}
</script>