import { createRoute, z, type RouteHandler } from '@hono/zod-openapi';
import { fetchSubtitlesText } from '../../../../../utils/index.ts';
import { RawDownloadQuerySchema } from '../../../../../interfaces/index.ts';

export const route = createRoute({
  method: 'get',
  path: '/raw',
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
    const message = error instanceof Error ? error.message : 'Failed to fetch subtitles';
    return c.text(message, 400);
  }
};
