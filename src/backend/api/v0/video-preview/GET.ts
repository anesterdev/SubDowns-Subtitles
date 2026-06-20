import { createRoute, z } from '@hono/zod-openapi';
import { fetchMetadata, extractVideoData } from '../../../../utils/index.ts';

export const route = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: z.object({
      vid_id: z.string().openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
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
          }),
        },
      },
      description: 'Successfully fetched video metadata',
    },
    400: {
      description: 'Invalid request or video not found',
    },
  },
  summary: 'Get Video Preview Metadata',
  description: 'Fetches basic video information, author details, and available subtitle languages from a given YouTube video ID.',
});

export const handler = async (c: any) => {
  const { vid_id } = c.req.valid('query');

  try {
    const playerResponse = await fetchMetadata(vid_id);
    if (!playerResponse) {
      return c.json({ error: 'Video metadata not found' }, 400);
    }

    const videoData = extractVideoData(playerResponse, vid_id);
    
    // Extract subtitle information
    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    const availableLanguages = tracks.map((t: any) => t.name.simpleText);

    const translationLanguages = playerResponse.captions?.playerCaptionsTracklistRenderer?.translationLanguages || [];
    const autoLanguages = translationLanguages.map((t: any) => t.languageName.simpleText);

    return c.json({
      ...videoData,
      subtitles: {
        available_languages: availableLanguages,
        auto_translate_languages: autoLanguages,
        count: availableLanguages.length,
      }
    }, 200);

  } catch (error) {
    return c.json({ error: 'Failed to fetch video preview' }, 400);
  }
};
