import { z } from 'zod';

export const VideoPreviewQuerySchema = z.object({
  vid_id: z.string().regex(/^[0-9A-Za-z_-]{11}$/).openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
});

export const VideoPreviewResponseSchema = z.object({
  video: z.object({
    title: z.string(),
    video_id: z.string(),
    created_at: z.string(),
    thumbnail_url: z.string().optional(),
    duration: z.string().optional(),
  }),
  author: z.object({
    channel_name: z.string(),
    channel_id: z.string(),
  }),
  subtitles: z.object({
    available_languages: z.array(z.string()),
    auto_translate_languages: z.array(z.string()),
    count: z.number(),
  }),
});

export type VideoPreviewResponse = z.infer<typeof VideoPreviewResponseSchema>;
