import { createRoute, type RouteHandler } from '@hono/zod-openapi';
import { fetchMetadata, extractVideoData } from '../../../../utils/index.ts';
import { type YouTubeCaptionTrack, type YouTubeTranslationLanguage } from '../../../../interfaces/YouTube.ts';
import { VideoPreviewQuerySchema, VideoPreviewResponseSchema } from '../../../../interfaces/index.ts';
import { logger } from '../../../logger.ts';

export const route = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: VideoPreviewQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: VideoPreviewResponseSchema,
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

export const handler: RouteHandler<typeof route> = async (c) => {
  const { vid_id } = c.req.valid('query');

    try {
        const playerResponse = await fetchMetadata(vid_id, c.req.raw.signal);
    if (!playerResponse || playerResponse.playabilityStatus?.status === 'ERROR' || !playerResponse.videoDetails) {
      return c.json({ error: 'video_not_found' }, 404);
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
    }, 200, { 'Cache-Control': 'public, max-age=600' });

    } catch (error) {
    logger.error('Failed to fetch video preview for {vid_id}: {error}', {
      vid_id,
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'fetch_failed' }, 502);
  }
};
