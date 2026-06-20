<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'download', url: string): void;
}>();

const url = ref('');

function onDownload() {
  if (url.value.trim()) {
    emit('download', url.value.trim());
  }
}
</script>

<template>
  <div class="downloader-hero">
    <div class="input-container">
      <div class="input-wrapper">
        <span class="material-symbols-outlined icon">link</span>
        <input 
          v-model="url" 
          type="text" 
          :placeholder="t('home.placeholder')" 
          @keyup.enter="onDownload"
        />
        <button v-if="url" class="clear-btn" @click="url = ''">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <button class="download-btn" @click="onDownload">
        <span class="material-symbols-outlined">download</span>
        {{ t('home.download') }}
      </button>
    </div>
    
    <p class="subtitle">{{ t('home.subtitle') }}</p>
  </div>
</template>

<style scoped lang="scss">
.downloader-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  max-width: 800px;
  position: relative;
}

.input-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);

  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;

  .icon {
    position: absolute;
    left: var(--space-md);
    color: var(--text-muted);
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 3.5rem;
    padding-left: 3rem;
    padding-right: 3rem;
    background-color: var(--bg-light);
    border: 1px solid rgba(var(--rgb-foreground), 0.1);
    border-radius: var(--radius-md);
    color: var(--text-bright);
    font-size: var(--font-size-base);
    transition: border-color var(--transition-fast) ease, box-shadow var(--transition-fast) ease;

    &:focus {
      outline: none;
      border-color: var(--text-accent);
      box-shadow: 0 0 0 1px var(--text-accent);
    }
  }

  .clear-btn {
    position: absolute;
    right: var(--space-sm);
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-xs);
    border-radius: 50%;
    transition: color var(--transition-fast) ease;

    &:hover {
      color: var(--text-bright);
    }
  }
}

.download-btn {
  height: 3.5rem;
  padding: 0 var(--space-xl);
  background-color: var(--bg-accent);
  color: var(--text-accent);
  border: 1px solid var(--text-accent);
  border-radius: var(--radius-md);
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast) ease, color var(--transition-fast) ease;

  &:hover {
    background-color: var(--text-accent);
    color: var(--bg);
  }

  &:active {
    background-color: var(--bg-accent);
    color: var(--text-accent);
  }
}

.subtitle {
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}
</style>
