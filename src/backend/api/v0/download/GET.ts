import { createRoute, z, RouteHandler } from '@hono/zod-openapi';
import { convertToSrt, fetchSubtitles } from '../../../../utils/index.ts';
import { SubtitleItem } from '../../../../interfaces/YouTube.ts';

export const route = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: z.object({
      vid_id: z.string().max(100).regex(/^[0-9A-Za-z_-]{11}$/).openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
      lang: z.string().max(100).openapi({ description: 'Target Language', example: 'English' }),
      format: z.enum(['srt', 'txt', 'raw']).openapi({ description: 'Download format' }),
      type: z.enum(['manual', 'auto']).default('manual').openapi({ description: 'Subtitle type' }),
    }),
  },
  responses: {
    200: {
      content: {
        'text/plain': { schema: z.string() },
        'application/json': {
          schema: z.array(
            z.object({
              start: z.string(),
              dur: z.string(),
              text: z.string(),
            })
          ),
        },
      },
      description: 'Subtitle file contents',
    },
    400: {
      description: 'Invalid request or video/subtitle not found',
    },
  },
  summary: 'Download Subtitles',
  description: 'Downloads and formats subtitles for a given video ID and language.',
});

export const handler: RouteHandler<typeof route> = async (c) => {
  const { vid_id, lang, format, type } = c.req.valid('query');

  try {
    const { subtitles, exactLangName, title } = await fetchSubtitles(vid_id, lang, {
        type: type as 'manual' | 'auto',
        allowFallback: type === 'manual' ? false : true,
    });
    
    let content: string | object = '';
    let contentType = 'text/plain; charset=utf-8';
    
    if (format === 'raw') {
        content = subtitles;
        contentType = 'application/json; charset=utf-8';
    } else if (format === 'txt') {
        content = subtitles.map((s: SubtitleItem) => s.text).join('\n');
    } else if (format === 'srt') {
        content = convertToSrt(subtitles);
    }

    const baseFilename = `[${vid_id}] - ${title} - [${exactLangName}].${format}`;
    const safeFilename = encodeURIComponent(baseFilename).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

    return new Response(format === 'raw' ? JSON.stringify(content, null, 2) : content as string, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}`,
        }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to download subtitles';
    return c.json({ error: message }, 400);
  }
};
