import { configure, getConsoleSink, getLogger } from '@logtape/logtape';

let configured = false;

export async function initLogger() {
  if (configured) return;
  await configure({
    sinks: { console: getConsoleSink() },
    loggers: [
      { category: ['logtape', 'meta'], lowestLevel: 'warning' },
      { category: ['hono'], sinks: ['console'], lowestLevel: 'info' },
      { category: ['mcp'], sinks: ['console'], lowestLevel: 'info' },
      { category: ['server'], sinks: ['console'], lowestLevel: 'info' },
    ],
  });
  configured = true;
}

export const logger = getLogger(['server']);
export const mcpLogger = getLogger(['mcp']);
