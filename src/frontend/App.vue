<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from './components/Header.vue';

const url = ref('');
const status = ref('Ready');

function startDownload() {
  status.value = 'Downloading...';
}
</script>

<template>
  <app-header />

  <div class="container">
    <h1>YouTube Subtitle Downloader</h1>
    
    <div class="input-group">
      <input v-model="url" type="text" placeholder="https://youtu.be/..." />
      <button @click="startDownload">Download</button>
    </div>
    
    <div class="actions">
      <button class="warn">Warn Example</button>
      <button class="error">Error Example</button>
    </div>
    
    <p class="status">{{ status }}</p>
  </div>
</template>

<style scoped lang="scss">
.container {
  max-width: 600px;
  margin: calc(4rem + calc(var(--space-xl) * 2)) auto calc(var(--space-xl) * 2);
  text-align: center;
}

.input-group {
  display: flex;
  gap: var(--space-lg);
  margin: calc(var(--space-xl) * 1.5) 0;

  input {
    flex: 1;
  }
}

.actions {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  margin-top: calc(var(--space-xl) * 1.5);
}

.status {
  margin-top: calc(var(--space-xl) * 1.5);
  font-weight: bold;
  color: var(--text-muted);
}
</style>
