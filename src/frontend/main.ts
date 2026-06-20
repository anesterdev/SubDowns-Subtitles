import './styles.scss';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router.ts';

import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import i18n from './i18n.ts';

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

app.mount('#app');
