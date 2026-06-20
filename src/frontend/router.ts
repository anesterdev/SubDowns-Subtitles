import { createRouter, createWebHistory } from 'vue-router';
import Downloader from './pages/Downloader.vue';
import Preview from './pages/Preview.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Downloader,
  },
  {
    path: '/preview',
    name: 'Preview',
    component: Preview,
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('./pages/History.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
