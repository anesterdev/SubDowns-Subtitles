import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';

const app = new OpenAPIHono();

// Add CORS so the Vite frontend can access it
app.use('/api/*', cors());

const api = new OpenAPIHono();

// Example route using Zod for validation
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
          }),
        },
      },
      description: 'Check API health',
    },
  },
});

import videoPreviewRouter from './api/v0/video-preview/index.ts';

api.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok' }, 200);
});

// Mount the API on the main app
app.route('/api', api);

// Mount the v0 APIs
app.route('/api/v0/video-preview', videoPreviewRouter);

// Configure OpenAPI spec endpoint
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'YouTube Subtitle Downloader API',
  },
});

// Configure Scalar docs interface
app.get(
  '/api/docs',
  apiReference({
    theme: 'kepler',
    spec: {
      url: '/api/openapi.json',
    },
  })
);

// Serve the compiled Vue frontend statically in production
if (process.env.NODE_ENV !== 'development') {
  app.use('/assets/*', serveStatic({ root: './dist' }));
  app.get('/*', serveStatic({ path: './dist/index.html' }));
}

export default app;
