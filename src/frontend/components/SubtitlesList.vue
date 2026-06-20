<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue3-toastify';

defineProps<{
  title: string;
  icon: string;
  languages: string[];
  videoId: string;
  type: 'manual' | 'auto';
}>();

const isDownloading = ref<Record<string, boolean>>({});

async function downloadSubs(vidId: string, lang: string, format: string, type: 'manual' | 'auto') {
  if (!vidId) return;

  const key = `${lang}-${format}`;
  isDownloading.value[key] = true;

  try {
    const url = `/api/v0/download?vid_id=${encodeURIComponent(vidId)}&lang=${encodeURIComponent(lang)}&format=${format}&type=${type}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Download failed');
    }
    
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `subtitles.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1]);
      }
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || 'An error occurred during download');
  } finally {
    isDownloading.value[key] = false;
  }
}
</script>

<template>
  <div class="subtitles-list-container">
    <div class="header">
      <div class="title-group">
        <span class="material-symbols-outlined icon">{{ icon }}</span>
        <h3 class="title">{{ title }}</h3>
      </div>
    </div>

    <div class="list-wrapper">
      <div class="list-header">
        <div class="col-language">{{ $t('subtitles.language') }}</div>
        <div class="col-actions">{{ $t('subtitles.actions') }}</div>
      </div>
      
      <div class="list-body">
        <div 
          class="list-row group" 
          v-for="lang in languages" 
          :key="lang"
        >
          <div class="col-language">
            <span class="dot"></span>
            <span class="lang-name">{{ lang }}</span>
          </div>
          <div class="col-actions">
            <button variant="action" size="sm" :disabled="isDownloading[`${lang}-srt`]" @click="downloadSubs(videoId, lang, 'srt', type)">
              <span class="material-symbols-outlined" v-if="!isDownloading[`${lang}-srt`]">description</span>
              <span class="material-symbols-outlined" v-else>hourglass_empty</span>
              SRT
            </button>
            <button variant="action" size="sm" :disabled="isDownloading[`${lang}-txt`]" @click="downloadSubs(videoId, lang, 'txt', type)">
              <span class="material-symbols-outlined" v-if="!isDownloading[`${lang}-txt`]">article</span>
              <span class="material-symbols-outlined" v-else>hourglass_empty</span>
              TXT
            </button>
            <button variant="action" size="sm" :disabled="isDownloading[`${lang}-raw`]" @click="downloadSubs(videoId, lang, 'raw', type)">
              <span class="material-symbols-outlined" v-if="!isDownloading[`${lang}-raw`]">data_object</span>
              <span class="material-symbols-outlined" v-else>hourglass_empty</span>
              RAW
            </button>
          </div>
        </div>
        
        <div v-if="languages.length === 0" class="empty-state">
          {{ $t('subtitles.no_languages') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.subtitles-list-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
}

.title-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.icon {
  color: var(--text-accent);
}

.title {
  font-size: var(--font-size-lg);
  color: var(--text-bright);
  font-weight: 600;
  margin: 0;
}

.list-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(var(--rgb-white), 0.05);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  background-color: rgba(var(--rgb-white), 0.02);
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.list-body {
  max-height: 24rem;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(var(--rgb-white), 0.1);
    border-radius: var(--radius-sm);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(var(--rgb-white), 0.2);
  }
}

.list-row {
  display: flex;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background-color: var(--bg-light);
  border-top: 1px solid rgba(var(--rgb-white), 0.02);
  transition: background-color var(--transition-fast) ease;

  &:hover {
    background-color: rgba(var(--rgb-white), 0.04);
  }
}

.col-language {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgba(var(--rgb-accent), 0.4);
  transition: background-color var(--transition-fast) ease;

  .group:hover & {
    background-color: var(--text-accent);
  }
}

.lang-name {
  color: var(--text-bright);
}

.col-actions {
  display: flex;
  gap: var(--space-xs);
  justify-content: flex-end;
}

.empty-state {
  padding: var(--space-lg);
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  background-color: var(--bg-light);
}
</style>
