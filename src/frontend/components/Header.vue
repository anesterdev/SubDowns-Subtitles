<script setup lang="ts">
import { loadLocale } from '../i18n.ts';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { locale } = useI18n();

const displayLanguage = computed(() => locale.value.toString().toUpperCase());
</script>

<template>
  <header class="app-header">
    <div class="header-brand">
      <strong>Subtitle Downloader</strong>
    </div>
    <nav class="header-pages">
      <router-link to="/" active-class="active">{{ $t('header.home') }}</router-link>
      <router-link to="/history" active-class="active">{{ $t('header.history') }}</router-link>
    </nav>
    <div class="header-links">
      <select class="lang-select" :value="locale" @change="loadLocale(($event.target as HTMLSelectElement).value)">
        <button type="button" class="select-trigger">{{ displayLanguage }}</button>
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="zh">ZH</option>
        <option value="ru">RU</option>
      </select>
      <a href="https://github.com" target="_blank">GitHub</a>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rem;

  background-color: var(--bg-light);
  border-bottom: 1px solid rgba(var(--rgb-white), 0.09);
  padding: 0 var(--space-xl);
  
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--space-lg);
  align-items: center;
}

.header-brand {
  justify-self: start;
  font-size: var(--font-size-lg);
}

.header-pages {
  justify-self: center;
  display: flex;
  gap: var(--space-lg);
  
  a {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 600;
    transition: color var(--transition-fast) ease;
    
    &.active {
      color: var(--text-accent);
    }
    
    &:hover:not(.active) {
      color: var(--text-bright);
    }
  }
}

.header-links {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  
  a {
    color: var(--text-muted);
    text-decoration: none;
    font-weight: 600;
    transition: color var(--transition-fast) ease;
    
    &:hover {
      color: var(--text-bright);
    }
  }

  .lang-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-color: transparent;
    color: var(--text-muted);
    border: none;
    padding: 0;
    margin: 0;
    font-weight: 600;
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    outline: none;
    transition: color var(--transition-fast) ease;

    &:hover {
      color: var(--text-bright);
    }

    option {
      background-color: var(--bg-light);
      color: var(--text);
    }

    @supports (appearance: base-select) {
      appearance: base-select;

      &::picker-icon {
        display: none;
      }

      .select-trigger {
        appearance: none;
        background: transparent;
        border: none;
        color: inherit;
        font: inherit;
        padding: 0;
        margin: 0;
        cursor: pointer;
      }
    }
  }
}
</style>
