<script setup>
import { RouterView } from 'vue-router'
import CatalogView from './views/CatalogView.vue';

// Não precisamos de componentes ou lógica adicional aqui, 
// a menos que você queira um cabeçalho/navegação que seja 
// visível em TODAS as páginas (incluindo login).
// Para o MVP, vamos mantê-lo simples.
</script>

<template>
  <CatalogView/>
  <!-- <RouterView /> -->
</template>

<style>
/* Você pode manter seus estilos globais aqui, ou importá-los */

</style>