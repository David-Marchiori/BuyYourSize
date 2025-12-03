<script setup>
import { RouterView } from 'vue-router'

// Não precisamos de componentes ou lógica adicional aqui, 
// a menos que você queira um cabeçalho/navegação que seja 
// visível em TODAS as páginas (incluindo login).
// Para o MVP, vamos mantê-lo simples.
</script>

<template>
  <RouterView />
</template>

<style>
/* Você pode manter seus estilos globais aqui, ou importá-los */
body {
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  margin: 0;
  padding: 0;
}
</style>