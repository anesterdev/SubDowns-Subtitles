import { createRoute, z, RouteHandler } from '@hono/zod-openapi';
import { fetchSubtitlesText } from '../../../../../utils/index.ts';

export const route = createRoute({
  method: 'get',
  path: '/raw',
  request: {
    query: z.object({
      vid_id: z.string().regex(/^[0-9A-Za-z_-]{11}$/).openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
      lang: z.string().optional().default('English').openapi({ description: 'Target Language', example: 'English' }),
    }),
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
    const content = await fetchSubtitlesText(vid_id, lang);
    return c.text(content, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch subtitles';
    return c.text(message, 400);
  }
};
