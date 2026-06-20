<script setup lang="ts">
import type { IVideoObject } from '../../interfaces/VideoObject.ts';

const props = defineProps<{
  video: IVideoObject['video'];
}>();

function downloadSubs(lang: string, format: string) {
  if (!props.video?.video_id) return;
  const url = `/api/v0/download?vid_id=${encodeURIComponent(props.video.video_id)}&lang=${encodeURIComponent(lang)}&format=${format}`;
  window.open(url, '_blank');
}
</script>

<template>
  <div class="video-preview-island glass-card">
    <div class="thumbnail-wrapper">
      <img :src="video.thumbnail_url" alt="Video Thumbnail" />
    </div>
    
    <div class="metadata">
      <h2 class="title">{{ video.title }}</h2>
      
      <div class="details">
        <span class="detail-item">
          <span class="material-symbols-outlined icon">schedule</span>
          {{ video.duration || '0' }}s
        </span>
        <span class="detail-item">
          <span class="material-symbols-outlined icon">hd</span>
          HD
        </span>
      </div>

      <div class="main-language-block" v-if="video.main_language || true">
        <div class="lang-info">
          <span class="material-symbols-outlined text-accent icon">translate</span>
          <span class="lang-name">English</span>
          <span class="badge">Auto-generated</span>
        </div>
        <div class="actions">
          <button variant="action" size="sm" @click="downloadSubs('English', 'srt')">
            <span class="material-symbols-outlined">description</span> SRT
          </button>
          <button variant="action" size="sm" @click="downloadSubs('English', 'txt')">
            <span class="material-symbols-outlined">article</span> TXT
          </button>
          <button variant="action" size="sm" @click="downloadSubs('English', 'raw')">
            <span class="material-symbols-outlined">data_object</span> RAW
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
      margin: 0;
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
      margin-top: var(--space-md);
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
