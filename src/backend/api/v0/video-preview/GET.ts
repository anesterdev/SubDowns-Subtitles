import { createRoute, z } from '@hono/zod-openapi';
import { fetchMetadata, extractVideoData } from '../../../../utils/index.ts';
import type { Context } from 'hono';
import { YouTubeCaptionTrack, YouTubeTranslationLanguage } from '../../../../interfaces/YouTube.ts';

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

export const handler = async (c: Context) => {
  const { vid_id } = c.req.valid('query');

  try {
    const playerResponse = await fetchMetadata(vid_id);
    if (!playerResponse || playerResponse.playabilityStatus?.status === 'ERROR' || !playerResponse.videoDetails) {
      const reason = playerResponse?.playabilityStatus?.reason || 'Video not found or unavailable';
      return c.json({ error: reason }, 404);
    }

    const videoData = extractVideoData(playerResponse, vid_id);
    
    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    const availableLanguages = tracks
      .map((t: YouTubeCaptionTrack) => t.name.simpleText)
      .sort((a: string, b: string) => {
        const isAAuto = a.toLowerCase().includes('auto');
        const isBAuto = b.toLowerCase().includes('auto');
        if (isAAuto && !isBAuto) return 1;
        if (!isAAuto && isBAuto) return -1;
        return 0;
      });

    const translationLanguages = playerResponse.captions?.playerCaptionsTracklistRenderer?.translationLanguages || [];
    const autoLanguages = translationLanguages.map((t: YouTubeTranslationLanguage) => t.languageName.simpleText);

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
