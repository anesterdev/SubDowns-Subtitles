import { serve } from '@hono/node-server';
import app from './server.ts';

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);
console.log(`API Docs are available at http://localhost:${port}/api/docs`);

serve({
  fetch: app.fetch,
  port,
});
