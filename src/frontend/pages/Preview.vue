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

import { watch } from 'vue';
import { APP_TITLE } from '../constants/index.ts';

onMounted(async () => {
  if (!vidId.value) {
    router.push('/');
    return;
  }

  await videoStore.fetchVideo(vidId.value);
});

watch(() => videoStore.currentVideo, (newVal) => {
  if (newVal?.video?.title) {
    document.title = `${APP_TITLE} - ${newVal.video.title}`;
  } else {
    document.title = APP_TITLE;
  }
}, { immediate: true });
</script>

<template>
  <div class="page-container">
    <div v-if="videoStore.status === 'Fetching' || (videoStore.status === 'Ready' && videoStore.currentVideo)" class="preview-layout">
      <VideoPreviewIsland 
        :video="videoStore.currentVideo?.video" 
        :loading="videoStore.status === 'Fetching'"
      />
      
      <div class="subtitles-grid">
        <SubtitlesList 
          :title="$t('preview.original_subtitles')" 
          icon="subtitles" 
          :videoId="videoStore.currentVideo?.video.video_id || vidId"
          type="manual"
          :languages="videoStore.currentVideo?.subtitles?.available_languages" 
          :loading="videoStore.status === 'Fetching'"
          :skeletonCount="3"
        />
        
        <SubtitlesList 
          :title="$t('preview.auto_translate')" 
          icon="auto_fix" 
          :videoId="videoStore.currentVideo?.video.video_id || vidId"
          type="auto"
          :languages="videoStore.currentVideo?.subtitles?.auto_translate_languages" 
          :loading="videoStore.status === 'Fetching'"
          :skeletonCount="5"
        />
      </div>
    </div>
    
    <div v-else-if="videoStore.status === 'Error'" class="error">
      <p>{{ $t('preview.error_fetching') }}</p>
      <button class="warn" @click="router.push('/')">{{ $t('preview.go_back') }}</button>
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
