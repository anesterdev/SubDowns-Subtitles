<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const vidId = ref(route.query.vid_id as string || '');
const status = ref('Fetching video metadata...');
const subtitlesCount = ref(0);
const subtitlesAvailable = ref(false);

onMounted(() => {
  if (!vidId.value) {
    router.push('/');
    return;
  }

  // Mocking the backend fetch process for UI purposes
  setTimeout(() => {
    subtitlesCount.value = 3;
    subtitlesAvailable.value = true;
    status.value = 'Ready';
  }, 1000);
});

function downloadSubtitles() {
  status.value = 'Downloading subtitles...';
}
</script>

<template>
  <div class="page-container">
    <h1>Video Preview</h1>
    <p class="vid-id">Target Video ID: <span>{{ vidId }}</span></p>

    <div class="stats-card">
      <div v-if="status === 'Fetching video metadata...'" class="loading">
        {{ status }}
      </div>
      <div v-else class="results">
        <h2>Subtitles Found: <span class="highlight">{{ subtitlesCount }}</span></h2>
        
        <div class="actions" v-if="subtitlesAvailable">
          <button @click="downloadSubtitles">Download All Available</button>
        </div>
        <p class="status">{{ status }}</p>
      </div>
    </div>
    
    <button class="warn" @click="router.push('/')">Go Back</button>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  max-width: 600px;
  margin: calc(4rem + calc(var(--space-xl) * 2)) auto calc(var(--space-xl) * 2);
  text-align: center;
}

.vid-id {
  margin-top: var(--space-md);
  color: var(--text-muted);
  
  span {
    color: var(--text-bright);
    font-family: monospace;
  }
}

.stats-card {
  background-color: var(--bg-light);
  border: 1px solid rgba(var(--rgb-white), 0.09);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  margin: calc(var(--space-xl) * 1.5) 0;
}

.highlight {
  color: var(--text-accent);
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: var(--space-lg);
}

.status {
  margin-top: var(--space-lg);
  font-weight: bold;
  color: var(--text-muted);
}

.loading {
  color: var(--text-muted);
  font-style: italic;
}
</style>
