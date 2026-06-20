<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useVideoStore } from '../stores/videoStore.ts';
import VideoPreviewIsland from '../components/VideoPreviewIsland.vue';
import SubtitlesList from '../components/SubtitlesList.vue';

const route = useRoute();
const router = useRouter();
const videoStore = useVideoStore();

const vidId = ref(route.query.vid_id as string || '');

onMounted(async () => {
  if (!vidId.value) {
    router.push('/');
    return;
  }

  await videoStore.fetchVideo(vidId.value);
});
</script>

<template>
  <div class="page-container">
    <div v-if="videoStore.status === 'Fetching'" class="loading">
      Fetching video metadata...
    </div>
    
    <div v-else-if="videoStore.status === 'Ready' && videoStore.currentVideo" class="preview-layout">
      <VideoPreviewIsland :video="videoStore.currentVideo.video" />
      
      <div class="subtitles-grid">
        <SubtitlesList 
          title="Original Subtitles" 
          icon="subtitles" 
          :languages="videoStore.currentVideo.subtitles?.available_languages || []" 
        />
        
        <SubtitlesList 
          title="Auto-translate" 
          icon="auto_fix" 
          :languages="[]" 
        />
      </div>
    </div>
    
    <div v-else-if="videoStore.status === 'Error'" class="error">
      <p>Error fetching video data</p>
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
