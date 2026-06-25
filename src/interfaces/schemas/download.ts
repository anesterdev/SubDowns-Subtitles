import { z } from 'zod';

export const DownloadQuerySchema = z.object({
  vid_id: z.string().max(100).regex(/^[0-9A-Za-z_-]{11}$/).openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
  lang: z.string().max(100).openapi({ description: 'Target Language', example: 'English' }),
  format: z.enum(['srt', 'txt', 'raw']).openapi({ description: 'Download format' }),
  type: z.enum(['manual', 'auto']).default('manual').openapi({ description: 'Subtitle type' }),
});
