<script setup lang="ts">
defineProps<{
  title: string;
  icon: string;
  languages: string[];
}>();
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
        <div class="col-language">Language</div>
        <div class="col-actions">Actions</div>
      </div>
      
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
          <button class="action-btn">SRT</button>
          <button class="action-btn">TXT</button>
          <button class="action-btn">RAW</button>
        </div>
      </div>
      
      <div v-if="languages.length === 0" class="empty-state">
        No languages found.
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

.action-btn {
  background: rgba(var(--rgb-accent), 0.08);
  border: 1px solid rgba(var(--rgb-accent), 0.2);
  color: var(--text-accent);
  border-radius: var(--radius-sm);
  padding: var(--space-xs) var(--space-sm);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast) ease;

  &:hover {
    background: var(--text-accent);
    color: var(--bg);
    border-color: transparent;
  }
}

.empty-state {
  padding: var(--space-lg);
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  background-color: var(--bg-light);
}
</style>
