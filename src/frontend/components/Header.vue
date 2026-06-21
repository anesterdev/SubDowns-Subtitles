<script setup lang="ts">
import { loadLocale } from '../i18n.ts';
import { useI18n } from 'vue-i18n';
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import i18n from '../i18n.ts';
import { APP_TITLE } from '../constants/index.ts';

const { locale, t } = useI18n();
const route = useRoute();

import { useDark, useToggle } from '@vueuse/core';

if (typeof window !== 'undefined' && !localStorage.getItem('theme')) {
  localStorage.setItem('theme', 'dark');
}

const isDark = useDark({
  selector: 'body',
  attribute: 'class',
  valueDark: '',
  valueLight: 'theme-white',
  storageKey: 'theme',
});
const toggleTheme = useToggle(isDark);

async function handleLanguageChange(event: Event) {
  const target = (event.target as HTMLSelectElement).value;
  await loadLocale(target);
  
  if (route.meta.titleKey) {
    document.title = `${APP_TITLE} - ${i18n.global.t(route.meta.titleKey as string)}`;
  }
}

const displayLanguage = computed(() => locale.value.toString().toUpperCase());
</script>

<template>
  <header class="app-header">
    <div class="header-brand">
      <strong><span>Sub</span>Downs</strong>
    </div>
    <nav class="header-pages">
      <router-link to="/" active-class="active">{{ t('header.home') }}</router-link>
      <router-link to="/history" active-class="active">{{ t('header.history') }}</router-link>
    </nav>
    <div class="header-links">
      <select class="lang-select" :value="locale" @change="handleLanguageChange">
        <option value="en">EN</option>
        <option value="es">ES</option>
        <option value="zh">ZH</option>
        <option value="ru">RU</option>
      </select>
      <button class="theme-toggle" @click="toggleTheme()">
        {{ !isDark ? t('header.theme_dark') : t('header.theme_light') }}
      </button>
      <a href="https://github.com/anesterdev" target="_blank">GitHub</a>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  height: 4rem;

  background-color: var(--bg-light);
  border-bottom: 1px solid rgba(var(--rgb-foreground), 0.09);
  padding: 0 var(--space-xl);
  transition: background-color var(--transition-fast) ease, border-color var(--transition-fast) ease;
  
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: var(--space-xl);
  align-items: center;
}

.header-brand {
  justify-self: start;
  font-size: var(--font-size-lg);

  span {
    color: var(--text-accent)
  }
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

  .theme-toggle {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
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
    }
  }
}
</style>
