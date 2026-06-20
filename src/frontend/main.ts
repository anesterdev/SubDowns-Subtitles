import './styles.scss';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router.ts';

import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import i18n, { loadLocale } from './i18n.ts';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(Vue3Toastify, {
  autoClose: 3000,
  theme: 'dark',
  position: 'bottom-right'
} as ToastContainerOptions);

const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark';
if (savedTheme === 'light' && typeof document !== 'undefined') {
  document.body.classList.add('theme-white');
}

const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('lang') || 'en' : 'en';
if (savedLocale !== 'en') {
  try {
    await loadLocale(savedLocale);
  } catch (err) {
    console.error('Failed to load initial locale', err);
  }
}

app.mount('#app');
