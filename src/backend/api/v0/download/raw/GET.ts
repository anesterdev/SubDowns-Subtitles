import { createRoute, z, type RouteHandler } from '@hono/zod-openapi';
import { fetchSubtitlesText, SubtitleError } from '../../../../../utils/index.ts';
import { RawDownloadQuerySchema } from '../../../../../interfaces/index.ts';
import { logger } from '../../../../logger.ts';

export const route = createRoute({
  method: 'get',
  path: '/download/raw',
  request: {
    query: RawDownloadQuerySchema,
  },
  responses: {
    200: {
      content: {
        'text/plain': { schema: z.string() },
      },
      description: 'Raw subtitle text',
    },
    400: {
      description: 'Invalid request or video/subtitle not found',
    },
  },
  summary: 'Get Raw Subtitles for AI',
  description: 'Returns subtitles as plain text for AI agents to easily consume without downloading files.',
});

export const handler: RouteHandler<typeof route> = async (c) => {
  const { vid_id, lang } = c.req.valid('query');

    try {
        const content = await fetchSubtitlesText(vid_id, lang, c.req.raw.signal);
    return c.text(content, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Raw download failed for vid={vid_id} lang={lang}: {error}', { vid_id, lang, error: message });

    if (error instanceof SubtitleError) {
      return c.text(error.code, error.status);
    }
    return c.text('download_failed', 502);
  }
};
