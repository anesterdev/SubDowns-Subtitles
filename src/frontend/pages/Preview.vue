<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { IVideoObject } from '../../interfaces/VideoObject.ts';
import VideoPreviewIsland from '../components/VideoPreviewIsland.vue';
import SubtitlesList from '../components/SubtitlesList.vue';

const route = useRoute();
const router = useRouter();

const vidId = ref(route.query.vid_id as string || '');
const status = ref('Fetching video metadata...');
const videoData = ref<IVideoObject | null>(null);

onMounted(async () => {
  if (!vidId.value) {
    router.push('/');
    return;
  }

  try {
    const res = await fetch(`/api/v0/video-preview?vid_id=${vidId.value}`);
    if (!res.ok) throw new Error('Video metadata not found');
    
    videoData.value = await res.json();
    status.value = 'Ready';
  } catch (error) {
    status.value = 'Error fetching video data';
  }
});
</script>

<template>
  <div class="page-container">
    <div v-if="status === 'Fetching video metadata...'" class="loading">
      {{ status }}
    </div>
    
    <div v-else-if="videoData" class="preview-layout">
      <VideoPreviewIsland :video="videoData.video" />
      
      <div class="subtitles-grid">
        <SubtitlesList 
          title="Original Subtitles" 
          icon="subtitles" 
          :languages="videoData.subtitles?.available_languages || []" 
        />
        
        <SubtitlesList 
          title="Auto-translate" 
          icon="auto_fix" 
          :languages="[]" 
        />
      </div>
    </div>
    
    <div v-else class="error">
      <p>{{ status }}</p>
      <button class="warn" @click="router.push('/')">Go Back</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  max-width: 1200px;
  margin: calc(4rem + var(--space-xl)) auto var(--space-xl);
  padding: 0 var(--space-lg);
}

.preview-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.subtitles-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.loading, .error {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  margin-top: calc(var(--space-xl) * 2);
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  color: var(--error);
}
</style>
