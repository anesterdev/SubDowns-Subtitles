<script setup lang="ts">
import AppHeader from '../components/Header.vue';
</script>

<template>
  <app-header />
  <main class="app-main">
    <slot />
  </main>
</template>

<style scoped lang="scss">
@use '../ui-kit/mixins' as *;

.app-main {
  flex: 1;
  overflow-y: auto;
  @include custom-scrollbar;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(2rem + var(--space-xl)) var(--space-lg) var(--space-xl);
}
</style>
