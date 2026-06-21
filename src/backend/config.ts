import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional().transform((v) => v ? parseInt(v, 10) : 3069),
  RATE_LIMIT_MAX: z.string().optional().transform((v) => v ? parseInt(v, 10) : 100),
  RATE_LIMIT_WINDOW_MS: z.string().optional().transform((v) => v ? parseInt(v, 10) : 60000), // 1 minute default
  TRUST_PROXY: z.string().optional().transform((v) => v === 'true'),
});

export const config = envSchema.parse({
  PORT: process.env.PORT,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  TRUST_PROXY: process.env.TRUST_PROXY,
});
