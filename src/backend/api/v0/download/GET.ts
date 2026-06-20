import { createRoute, z } from '@hono/zod-openapi';
import { fetchMetadata, convertToSrt } from '../../../../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';

export const route = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: z.object({
      vid_id: z.string().openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
      lang: z.string().openapi({ description: 'Target Language', example: 'English' }),
      format: z.enum(['srt', 'txt', 'raw']).openapi({ description: 'Download format' }),
    }),
  },
  responses: {
    200: {
      content: {
        'text/plain': { schema: z.string() },
        'application/json': { schema: z.any() },
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

export const handler = async (c: any) => {
  const { vid_id, lang, format } = c.req.valid('query');

  try {
    const playerResponse = await fetchMetadata(vid_id);
    if (!playerResponse) {
      return c.json({ error: 'Video metadata not found' }, 400);
    }

    const title = playerResponse.videoDetails?.title?.replace(/[<>:"/\\|?*]+/g, '') || 'Video';
    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    
    const matchingTracks = tracks.filter((t: any) => t.name.simpleText.includes(lang));
    if (matchingTracks.length === 0) {
        return c.json({ error: `No subtitles found for language target '${lang}'` }, 400);
    }

    // Prefer manual subs (exact match) over auto-generated
    const manualTrack = matchingTracks.find((t: any) => t.name.simpleText.toLowerCase() === lang.toLowerCase());
    const selectedTrack = manualTrack || matchingTracks[0];

    const subtitles = await getSubtitles({ videoID: vid_id, lang: selectedTrack.languageCode });
    
    let content: string | object = '';
    let contentType = 'text/plain; charset=utf-8';
    
    if (format === 'raw') {
        content = subtitles;
        contentType = 'application/json; charset=utf-8';
    } else if (format === 'txt') {
        content = subtitles.map((s: any) => s.text).join('\n');
    } else if (format === 'srt') {
        content = convertToSrt(subtitles);
    }

    const baseFilename = `[${vid_id}] - ${title} - [${selectedTrack.name.simpleText}].${format}`;
    const safeFilename = encodeURIComponent(baseFilename).replace(/['()]/g, escape).replace(/\*/g, '%2A');

    return new Response(format === 'raw' ? JSON.stringify(content, null, 2) : content as string, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename*=UTF-8''${safeFilename}`,
        }
    });

  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to download subtitles' }, 400);
  }
};
