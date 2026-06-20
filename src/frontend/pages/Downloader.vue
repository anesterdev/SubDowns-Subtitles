<script setup lang="ts">
import { useRouter } from 'vue-router';
import DownloaderHero from '../components/DownloaderHero.vue';
import { toast } from 'vue3-toastify';

const router = useRouter();

function handleDownload(url: string) {
  try {
    const parsedUrl = new URL(url);
    let vidId = '';
    
    if (parsedUrl.hostname === 'youtu.be') {
      vidId = parsedUrl.pathname.slice(1);
    } else {
      vidId = parsedUrl.searchParams.get('v') || '';
    }
    
    if (!vidId && parsedUrl.pathname.startsWith('/embed/')) {
      vidId = parsedUrl.pathname.split('/')[2];
    }
    if (!vidId && parsedUrl.pathname.startsWith('/shorts/')) {
      vidId = parsedUrl.pathname.split('/')[2];
    }
    
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
