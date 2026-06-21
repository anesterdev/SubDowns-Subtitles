<script setup lang="ts">
import { useRouter } from 'vue-router';
import DownloaderHero from '../components/DownloaderHero.vue';
import { toast } from 'vue3-toastify';

import { extractVideoId } from '../../utils/url.ts';

const router = useRouter();

function handleDownload(url: string) {
  try {
    new URL(url);
    const vidId = extractVideoId(url);
    if (vidId) {
      router.push(`/preview?vid_id=${vidId}`);
    } else {
      toast.error('Invalid YouTube URL. Could not extract video ID.');
    }
  } catch (e) {
    toast.error('Please enter a valid URL.');
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
  flex: 1;
  width: 100%;
}
</style>
