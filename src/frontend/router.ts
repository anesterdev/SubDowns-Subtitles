import { createRouter, createWebHistory } from 'vue-router';
import Downloader from './pages/Downloader.vue';
import Preview from './pages/Preview.vue';

import { APP_TITLE } from './constants/index.ts';
import i18n from './i18n.ts';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Downloader,
    meta: { titleKey: 'page_titles.home' }
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
    meta: { titleKey: 'page_titles.history' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./pages/NotFound.vue'),
    meta: { titleKey: 'page_titles.not_found' }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  if (to.meta.titleKey) {
    document.title = `${APP_TITLE} - ${i18n.global.t(to.meta.titleKey as string)}`;
  } else {
    document.title = APP_TITLE;
  }
  
  // Accessibility: Focus management on route transitions
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.setAttribute('tabindex', '-1');
    appContainer.focus({ preventScroll: true });
  }
});

export default router;
