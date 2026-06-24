import { z } from 'zod';

const intFromEnv = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : Number(v)))
    .pipe(
      z
        .number()
        .int()
        .positive()
        .or(z.literal(fallback)),
    );

const envSchema = z.object({
  PORT: intFromEnv(3069),
  RATE_LIMIT_MAX: intFromEnv(100),
  RATE_LIMIT_WINDOW_MS: intFromEnv(60000),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
});

const parsed = envSchema.safeParse({
  PORT: process.env.PORT,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  TRUST_PROXY: process.env.TRUST_PROXY,
});

if (!parsed.success) {
  console.error('[config] Invalid environment variables, using defaults:', parsed.error.flatten().fieldErrors);
}

const defaults = {
  PORT: 3069,
  RATE_LIMIT_MAX: 100,
  RATE_LIMIT_WINDOW_MS: 60000,
  TRUST_PROXY: false,
} as const;

export const config = parsed.success ? parsed.data : defaults;
