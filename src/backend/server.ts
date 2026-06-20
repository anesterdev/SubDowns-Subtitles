import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';

import apiRouter from './api/index.ts';
import { initMCPServer } from './mcp.ts';
import { config } from './config.ts';

initMCPServer(); // Boot the remote MCP Server for AI agents alongside the backend

const app = new OpenAPIHono();

// Add CORS so the Vite frontend can access it
app.use('/api/*', cors());

// Simple memory-based rate limiter middleware
const ipCache = new Map<string, { count: number; resetTime: number }>();
app.use('/api/*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'ip';
  const now = Date.now();
  const client = ipCache.get(ip);
  if (!client || now > client.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + config.RATE_LIMIT_WINDOW_MS });
  } else {
    client.count++;
    if (client.count > config.RATE_LIMIT_MAX) {
      return c.json({ error: 'Too many requests, please try again later.' }, 429);
    }
  }
  return await next();
});

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

  const port = config.PORT;
  console.log(`Starting SubDowns Production Server on port ${port}...`);
  serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0'
  });
}

export default app;
