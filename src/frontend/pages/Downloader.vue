<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import DownloaderHero from '../components/DownloaderHero.vue';
import { extractVideoId } from '../../utils/url.ts';

const router = useRouter();
const { t } = useI18n();
const isNavigating = ref(false);

function handleDownload(url: string) {
  try {
    new URL(url);
  } catch {
    toast.error(t('errors.invalid_url'));
    return;
  }
  const vidId = extractVideoId(url);
  if (!vidId) {
    toast.error(t('errors.invalid_youtube_url'));
    return;
  }
  isNavigating.value = true;
  router.push(`/preview?vid_id=${vidId}`).catch(() => { isNavigating.value = false; });
}
</script>

<template>
  <div class="page-container">
    <DownloaderHero :disabled="isNavigating" @download="handleDownload" />
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
