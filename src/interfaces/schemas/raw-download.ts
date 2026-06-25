import { z } from 'zod';

export const RawDownloadQuerySchema = z.object({
  vid_id: z.string().max(100).regex(/^[0-9A-Za-z_-]{11}$/).openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
  lang: z.string().max(100).optional().default('English').openapi({ description: 'Target Language', example: 'English' }),
});
