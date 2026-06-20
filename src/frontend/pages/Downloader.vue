<script setup lang="ts">
import { useRouter } from 'vue-router';
import DownloaderHero from '../components/DownloaderHero.vue';

const router = useRouter();

function handleDownload(url: string) {
  try {
    const parsedUrl = new URL(url);
    const vidId = parsedUrl.searchParams.get('v');
    
    if (vidId) {
      router.push(`/preview?vid_id=${vidId}`);
    } else {
      alert('Invalid YouTube URL. Could not extract video ID.');
    }
  } catch (e) {
    alert('Please enter a valid URL.');
  }
}
</script>

<template>
  <div class="page-container">
    <DownloaderHero @download="handleDownload" />
  </div>
</template>

<style scoped lang="scss">
.page-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 8rem);
  padding: var(--space-xl) var(--space-lg);
}
</style>
