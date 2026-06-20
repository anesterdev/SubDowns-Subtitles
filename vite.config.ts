import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import hono from '@hono/vite-dev-server';

export default defineConfig({
  plugins: [
    hono({
      entry: 'src/backend/server.ts',
      exclude: [/^(?!\/api).*$/], // Exclude everything except for routes starting with /api
    }),
    vue(),
  ],
  build: {
    outDir: 'dist/frontend',
  },
});
