<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useVideoStore, type HistoryVideoCard } from '../stores/videoStore.ts';

const { t } = useI18n();
const router = useRouter();
const videoStore = useVideoStore();

const historyItems = ref<HistoryVideoCard[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  historyItems.value = await videoStore.loadHistory();
  isLoading.value = false;
});

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function viewVideo(vidId: string) {
  router.push(`/preview?vid_id=${vidId}`);
}
</script>

<template>
  <div class="page-container">
    <div class="header">
      <h1 class="title">{{ t('history.title') }}</h1>
    </div>

    <div v-if="isLoading" class="loading-state">
      {{ t('history.loading') }}
    </div>

    <div v-else-if="historyItems.length === 0" class="empty-state">
      {{ t('history.empty') }}
    </div>

    <div v-else class="cards-grid">
      <div 
        class="video-card" 
        v-for="item in historyItems" 
        :key="`${item.videoId}-${item.timestamp}`"
        role="button"
        tabindex="0"
        @click="viewVideo(item.videoId)"
        @keyup.enter="viewVideo(item.videoId)"
      >
        <div class="thumbnail-wrapper">
          <img :src="item.video.thumbnail_url" class="thumbnail" alt="thumbnail" />
        </div>
        
        <div class="card-body">
          <div class="card-meta">
            <span class="author">{{ item.author?.channel_name || 'YouTube' }}</span>
            <span class="dot">&middot;</span>
            <span class="date">{{ formatDate(item.timestamp) }}</span>
          </div>
          
          <h3 class="video-title">{{ item.video.title }}</h3>
          
          <div class="badges-row">
            <span class="badge">
              {{ item.language.toUpperCase() }}
            </span>
            <span 
              class="badge" 
              :class="{ 'auto-badge': item.type === 'auto' }"
            >
              {{ item.format.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../ui-kit/mixins' as *;

.page-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.header {
  display: flex;
  align-items: center;
}

.title {
  font-size: var(--font-size-xl);
  color: var(--text-bright);
  font-weight: 700;
}

.loading-state, .empty-state {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  padding: calc(var(--space-xl) * 2) 0;
  background-color: rgba(var(--rgb-foreground), 0.02);
  border-radius: var(--radius-lg);
  border: 1px dashed rgba(var(--rgb-foreground), 0.1);
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-lg);
}

.video-card {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-light);
  border: 1px solid rgba(var(--rgb-foreground), 0.05);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: background-color var(--transition-fast) ease, border-color var(--transition-fast) ease, box-shadow var(--transition-fast) ease, color var(--transition-fast) ease;

  &:hover {
    border-color: rgba(var(--rgb-accent), 0.3);
    box-shadow: 0 4px 12px rgba(var(--rgb-black), 0.2);
  }
}

.thumbnail-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: var(--bg);
  overflow: hidden;

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-body {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.85rem;
  color: var(--text-muted);
}

.author {
  font-weight: 600;
  color: var(--text);
  @include one-liner;
}

.video-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-bright);
  line-height: 1.4;
  
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  padding-top: var(--space-xs);
}

.badge {
  background: rgba(var(--rgb-foreground), 0.05);
  border: 1px solid rgba(var(--rgb-foreground), 0.1);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-muted);
  
  &.auto-badge {
    color: var(--text-accent);
    border-color: rgba(var(--rgb-accent), 0.2);
    background: rgba(var(--rgb-accent), 0.05);
  }
  
  &.more {
    background: transparent;
    border-color: transparent;
  }
}
</style>
