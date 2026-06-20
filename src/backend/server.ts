import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';

import apiRouter from './api/index.ts';

const app = new OpenAPIHono();

// Add CORS so the Vite frontend can access it
app.use('/api/*', cors());

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


apiRouter.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok' }, 200);
});

// Mount the API on the main app
app.route('/api', apiRouter);

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
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './dist/frontend' }));
  app.get('/*', serveStatic({ path: './dist/frontend/index.html' }));

  const port = parseInt(process.env.PORT || '3069', 10);
  console.log(`Starting SubDowns Production Server on port ${port}...`);
  serve({
    fetch: app.fetch,
    port
  });
}

export default app;
