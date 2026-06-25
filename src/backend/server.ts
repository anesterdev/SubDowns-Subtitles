import { fileURLToPath } from 'url';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { honoLogger } from '@logtape/hono';

import apiRouter from './api/index.ts';
import { initMCPServerRoutes, drainMCPServers } from './mcp.ts';
import { config } from './config.ts';
import { initLogger, logger } from './logger.ts';

import { rateLimiter } from 'hono-rate-limiter';
import { getConnInfo } from '@hono/node-server/conninfo';

const app = new OpenAPIHono();

app.use('*', honoLogger({
  category: ['hono'],
  skip: (c) => {
    const p = c.req.path;
    return p === '/api/health' ||
      p.startsWith('/assets/') ||
      p === '/favicon.ico' ||
      p.startsWith('/.well-known/') ||
      (p === '/' || p === '/index.html') ||
      p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.ico') || p.endsWith('.map');
  },
}));

// Add CORS so the Vite frontend can access it
app.use('/api/*', cors());
app.use('*', secureHeaders());

// Rate limiter using hono-rate-limiter with secure key generator
const limiter = rateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  limit: (c) => c.req.path === '/api/mcp/message' ? config.RATE_LIMIT_MAX * 2 : config.RATE_LIMIT_MAX,
  keyGenerator: (c) => {
    if (config.TRUST_PROXY) {
      const forwardedFor = c.req.header('x-forwarded-for');
      if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
      }
    }
    try {
      const conn = getConnInfo(c);
      return conn.remote.address || 'ip';
    } catch {
      return 'ip';
    }
  },
  message: { error: 'Too many requests, please try again later.' },
  statusCode: 429,
});
app.use('/api/*', limiter);

const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
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

app.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok' }, 200);
});

// Register MCP server routes on apiRouter
initMCPServerRoutes(apiRouter);

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

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
const shouldBoot = process.env.NODE_ENV === 'production' || isMainModule;

if (shouldBoot) {
  await initLogger();

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, draining MCP connections and shutting down');
    Promise.race([
      drainMCPServers(),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]).finally(() => process.exit(0));
  });

  if (process.env.NODE_ENV === 'production') {
    app.use('/*', serveStatic({ root: './dist/frontend' }));
    app.get('/*', serveStatic({ path: './dist/frontend/index.html' }));
  }

  const port = config.PORT;
  logger.info(`Starting SubDowns Server on port ${port}...`);
  serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0'
  });
}

export default app;
