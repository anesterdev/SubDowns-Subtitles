import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import hono from '@hono/vite-dev-server';

export default defineConfig(() => {
  return {
    plugins: [
      hono({
        entry: 'src/backend/server.ts',
        exclude: [/^(?!\/api).*$/], // Exclude everything except for /api/* routes so they are passed to Hono Dev Server
      }),
      vue(),
    ],
    build: {
      outDir: 'dist/frontend',
      emptyOutDir: true,
    }
  };
});
