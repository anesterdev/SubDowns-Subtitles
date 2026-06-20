<script setup lang="ts">
import type { IVideoObject } from '../../interfaces/VideoObject.ts';

import { ref, computed } from 'vue';

const props = defineProps<{
  video?: IVideoObject['video'];
  author?: IVideoObject['author'];
  subtitles?: IVideoObject['subtitles'];
  loading?: boolean;
}>();

const mainLanguageInfo = computed(() => {
  if (props.subtitles?.available_languages && props.subtitles.available_languages.length > 0) {
    const lang = props.subtitles.available_languages[0];
    const isAuto = lang.toLowerCase().includes('auto');
    return {
      language: lang,
      type: 'manual' as const,
      badgeText: isAuto ? 'Auto-generated' : 'Original'
    };
  }
  if (props.subtitles?.auto_translate_languages && props.subtitles.auto_translate_languages.length > 0) {
    return {
      language: props.subtitles.auto_translate_languages[0],
      type: 'auto' as const,
      badgeText: 'Auto-generated'
    };
  }
  return null;
});

function formatDuration(duration?: string | number) {
  if (!duration) return '00:00';
  const totalSeconds = parseInt(duration.toString(), 10);
  if (isNaN(totalSeconds)) return '00:00';

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  if (h > 0) {
    const hStr = h.toString().padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

const isDownloading = ref<Record<string, boolean>>({});

async function downloadSubs(lang: string, format: string, type: 'manual' | 'auto') {
  if (!props.video?.video_id) return;
  
  const key = `${lang}-${format}`;
  isDownloading.value[key] = true;

  try {
    const url = `/api/v0/download?vid_id=${encodeURIComponent(props.video.video_id)}&lang=${encodeURIComponent(lang)}&format=${format}&type=${type}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');
    
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
  } catch (err) {
    console.error(err);
  } finally {
    isDownloading.value[key] = false;
  }
}
</script>

<template>
  <div class="video-preview-island glass-card">
    <div class="thumbnail-wrapper" :class="{ skeleton: loading || !video }">
      <img v-if="video" :src="video.thumbnail_url" alt="Video Thumbnail" />
    </div>
    
    <div class="metadata">
      <h2 class="title" :class="{ skeleton: loading || !video }">
        {{ video?.title || 'Skeleton title placeholder text' }}
      </h2>
      
      <div class="details" :class="{ skeleton: loading || !video }">
        <span class="detail-item" v-if="author">
          <span class="material-symbols-outlined icon">person</span>
          {{ author.channel_name }}
        </span>
        <span class="detail-item">
          <span class="material-symbols-outlined icon">schedule</span>
          {{ formatDuration(video?.duration) }}
        </span>
        <span class="detail-item">
          <span class="material-symbols-outlined icon">hd</span>
          HD
        </span>
      </div>

      <div class="main-language-block" :class="{ skeleton: loading || !video }" v-if="mainLanguageInfo || loading || !video">
        <div class="lang-info">
          <span class="material-symbols-outlined text-accent icon">translate</span>
          <span class="lang-name">{{ mainLanguageInfo?.language || 'Skeleton Text' }}</span>
          <span class="badge" :class="{'auto-badge': mainLanguageInfo?.type === 'auto'}">{{ mainLanguageInfo?.badgeText || 'Original' }}</span>
        </div>
        <div class="actions">
          <button variant="action" size="sm" :disabled="isDownloading[`${mainLanguageInfo?.language}-srt`]" @click="mainLanguageInfo && downloadSubs(mainLanguageInfo.language, 'srt', mainLanguageInfo.type)">
            <span class="material-symbols-outlined" v-if="!isDownloading[`${mainLanguageInfo?.language}-srt`]">description</span>
            <span class="material-symbols-outlined" v-else>hourglass_empty</span>
            SRT
          </button>
          <button variant="action" size="sm" :disabled="isDownloading[`${mainLanguageInfo?.language}-txt`]" @click="mainLanguageInfo && downloadSubs(mainLanguageInfo.language, 'txt', mainLanguageInfo.type)">
            <span class="material-symbols-outlined" v-if="!isDownloading[`${mainLanguageInfo?.language}-txt`]">article</span>
            <span class="material-symbols-outlined" v-else>hourglass_empty</span>
            TXT
          </button>
          <button variant="action" size="sm" :disabled="isDownloading[`${mainLanguageInfo?.language}-raw`]" @click="mainLanguageInfo && downloadSubs(mainLanguageInfo.language, 'raw', mainLanguageInfo.type)">
            <span class="material-symbols-outlined" v-if="!isDownloading[`${mainLanguageInfo?.language}-raw`]">data_object</span>
            <span class="material-symbols-outlined" v-else>hourglass_empty</span>
            RAW
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.video-preview-island {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background-color: var(--bg-light);
  border: 1px solid rgba(var(--rgb-white), 0.08);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast) ease;

  @media (min-width: 768px) {
    flex-direction: row;
  }

  &:hover {
    border-color: rgba(var(--rgb-accent), 0.3);
  }

  .thumbnail-wrapper {
    width: 100%;
    flex-shrink: 0;
    aspect-ratio: 16 / 9;
    display: flex;

    @media (min-width: 768px) {
      width: 280px;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-md);
      display: block;
    }
  }

  .metadata {
    flex-grow: 1;
    width: 100%;
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: var(--space-md);

    .title {
      color: var(--text-bright);
      font-size: var(--font-size-lg);
      font-weight: 600;
      line-height: 1.4;
    }
    .details {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      color: var(--text-muted);
      font-size: var(--font-size-sm);

      .detail-item {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        
        .icon {
          font-size: 1rem;
        }
      }
    }

    .main-language-block {
      align-self: end;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md);
      background-color: rgba(var(--rgb-bg-lowest), 0.5);
      border: 1px solid rgba(var(--rgb-white), 0.05);
      border-radius: var(--radius-md);

      .lang-info {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        flex-grow: 1;

        .icon {
          font-size: 1rem;
        }

        .text-accent {
          color: var(--text-accent);
        }

        .lang-name {
          font-weight: bold;
          color: var(--text-bright);
        }

        .badge {
          padding: 2px var(--space-sm);
          background-color: rgba(var(--rgb-white), 0.05);
          border-radius: 4px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
      }

      .actions {
        display: flex;
        gap: var(--space-xs);
      }
    }
  }
}
</style>
