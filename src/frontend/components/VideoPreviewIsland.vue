<script setup lang="ts">
import type { VideoPreviewResponse } from '../../interfaces/index.ts';

import { computed } from 'vue';
import { useDownload } from '../composables/useDownload.ts';
import type { DownloadFormat } from '../../interfaces/index.ts';
import { formatDuration } from '../../utils/format.ts';

const { isDownloading, downloadSubs, openRawTab } = useDownload();

const props = defineProps<{
  video?: VideoPreviewResponse['video'];
  author?: VideoPreviewResponse['author'];
  subtitles?: VideoPreviewResponse['subtitles'];
  loading?: boolean;
}>();

function isFormatDownloading(format: DownloadFormat): boolean {
  if (!props.video || !mainLanguageInfo.value) return false;
  return isDownloading({
    vidId: props.video.video_id,
    lang: mainLanguageInfo.value.language,
    format,
    type: mainLanguageInfo.value.type,
  });
}

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

const videoUrl = computed(() => props.video ? `https://www.youtube.com/watch?v=${props.video.video_id}` : undefined);
const channelUrl = computed(() => props.author?.channel_id ? `https://www.youtube.com/channel/${props.author.channel_id}` : undefined);

function handleDownload(format: 'srt' | 'txt') {
  if (mainLanguageInfo.value && props.video) {
    downloadSubs({
      vidId: props.video.video_id,
      lang: mainLanguageInfo.value.language,
      format,
      type: mainLanguageInfo.value.type,
    });
  }
}

function handleOpenRaw() {
  if (mainLanguageInfo.value && props.video) {
    openRawTab(props.video.video_id, mainLanguageInfo.value.language);
  }
}
</script>

<template>
  <div class="video-preview-island glass-card">
    <a class="thumbnail-wrapper" :class="{ skeleton: loading || !video }" :href="videoUrl" target="_blank" rel="noopener noreferrer">
      <img v-if="video" :src="video.thumbnail_url" alt="Video Thumbnail" />
    </a>
    
    <div class="metadata">
      <h2 class="title" :class="{ skeleton: loading || !video }">
        {{ video?.title || '\u00A0' }}
      </h2>
      
      <div class="details" :class="{ skeleton: loading || !video }">
        <a class="detail-item" v-if="author" :href="channelUrl" target="_blank" rel="noopener noreferrer">
          <i class="material-symbols-outlined icon">person</i>
          <span>
            {{ author.channel_name }}
          </span>
        </a>
        <span class="detail-item">
          <i class="material-symbols-outlined icon">schedule</i>
          {{ formatDuration(video?.duration) }}
        </span>
        <span class="detail-item">
          <i class="material-symbols-outlined icon">hd</i>
          HD
        </span>
      </div>

      <div class="main-language-block" :class="{ skeleton: loading || !video }" v-if="mainLanguageInfo || loading || !video">
        <div class="lang-info">
          <i class="material-symbols-outlined text-accent icon">translate</i>
          <span class="lang-name">{{ mainLanguageInfo?.language || '\u00A0' }}</span>
          <span class="badge" :class="{'auto-badge': mainLanguageInfo?.type === 'auto'}">{{ mainLanguageInfo?.badgeText || 'Original' }}</span>
        </div>
        <div class="actions">
          <button variant="action" size="sm" :disabled="!video || !mainLanguageInfo || isFormatDownloading('srt')" @click="handleDownload('srt')">
            <i class="material-symbols-outlined" v-if="!isFormatDownloading('srt')">description</i>
            <i class="material-symbols-outlined" v-else>hourglass_empty</i>
            SRT
          </button>
          <button variant="action" size="sm" :disabled="!video || !mainLanguageInfo || isFormatDownloading('txt')" @click="handleDownload('txt')">
            <i class="material-symbols-outlined" v-if="!isFormatDownloading('txt')">article</i>
            <i class="material-symbols-outlined" v-else>hourglass_empty</i>
            TXT
          </button>
          <button variant="action" size="sm" :disabled="!video || !mainLanguageInfo" @click="handleOpenRaw">
            <i class="material-symbols-outlined">data_object</i>
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
  border: 1px solid rgba(var(--rgb-foreground), 0.08);
  border-radius: var(--radius-lg);
  transition: background-color var(--transition-fast) ease, border-color var(--transition-fast) ease;

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
    text-decoration: none;
    color: inherit;

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
        color: inherit;
        text-decoration: none;
        
        display: flex;
        align-items: center;
        gap: var(--space-xs);

        span {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }
        
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
      border: 1px solid rgba(var(--rgb-foreground), 0.05);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast) ease, border-color var(--transition-fast) ease;

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
          background-color: rgba(var(--rgb-foreground), 0.05);
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
