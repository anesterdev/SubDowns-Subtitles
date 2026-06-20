import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional().transform((v) => v ? parseInt(v, 10) : 3069),
  MCP_PORT: z.string().optional().transform((v) => v ? parseInt(v, 10) : 9000),
  RATE_LIMIT_MAX: z.string().optional().transform((v) => v ? parseInt(v, 10) : 100),
  RATE_LIMIT_WINDOW_MS: z.string().optional().transform((v) => v ? parseInt(v, 10) : 60000), // 1 minute default
});

export const config = envSchema.parse({
  PORT: process.env.PORT,
  MCP_PORT: process.env.MCP_PORT,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
});
