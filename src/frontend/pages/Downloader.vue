<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const url = ref('');
const status = ref('Ready');
const router = useRouter();

function startDownload() {
  status.value = 'Analyzing...';
  
  // Fake extracting a video ID for UI purposes
  const match = url.value.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  if (match && match[1]) {
    router.push(`/preview?vid_id=${match[1]}`);
  } else {
    status.value = 'Invalid YouTube URL';
  }
}
</script>

<template>
  <div class="page-container">
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
.page-container {
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
