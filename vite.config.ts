import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import hono from '@hono/vite-dev-server';
import { initMCPServer } from './src/backend/mcp.ts';

export default defineConfig(() => {
  return {
    plugins: [
      hono({
        entry: 'src/backend/server.ts',
        exclude: [/^(?!\/api).*$/], // Exclude everything except for routes starting with /api
      }),
      vue(),
      {
        name: 'mcp-server-boot',
        configureServer() {
          initMCPServer();
        }
      }
    ],
    build: {
      outDir: 'dist/frontend',
    }
  };
});
