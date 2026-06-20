import { createRoute, z, RouteHandler } from '@hono/zod-openapi';
import { fetchMetadata, convertToSrt, fetchAutoSubtitles } from '../../../../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';
import { SubtitleItem, YouTubeCaptionTrack, YouTubeTranslationLanguage } from '../../../../interfaces/YouTube.ts';

export const route = createRoute({
  method: 'get',
  path: '/',
  request: {
    query: z.object({
      vid_id: z.string().regex(/^[0-9A-Za-z_-]{11}$/).openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
      lang: z.string().openapi({ description: 'Target Language', example: 'English' }),
      format: z.enum(['srt', 'txt', 'raw']).openapi({ description: 'Download format' }),
      type: z.enum(['manual', 'auto']).default('manual').openapi({ description: 'Subtitle type' }),
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

export const handler: RouteHandler<typeof route> = async (c) => {
  const { vid_id, lang, format, type } = c.req.valid('query');

  try {
    const playerResponse = await fetchMetadata(vid_id);
    if (!playerResponse) {
      return c.json({ error: 'Video metadata not found' }, 400);
    }

    const title = playerResponse.videoDetails?.title?.replace(/[<>:"/\\|?*]+/g, '') || 'Video';
    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    
    let subtitles: SubtitleItem[] | any[] = [];
    let exactLangName = lang;

    if (type === 'auto') {
        const translationLanguages = playerResponse.captions?.playerCaptionsTracklistRenderer?.translationLanguages || [];
        const targetLang = translationLanguages.find((t: YouTubeTranslationLanguage) => t.languageName.simpleText === lang);
        if (!targetLang) return c.json({ error: `Auto-translate language not found: '${lang}'` }, 400);

        // Auto-translate works by passing &tlang= to any valid track. The default track is the safest bet.
        const defaultTrack = tracks.find((t: YouTubeCaptionTrack) => t.isDefault) || tracks[0];
        if (!defaultTrack) return c.json({ error: 'No base track found for auto-translation' }, 400);

        subtitles = await fetchAutoSubtitles(defaultTrack.baseUrl, targetLang.languageCode);
        exactLangName = targetLang.languageName.simpleText;
    } else {
        const matchingTracks = tracks.filter((t: YouTubeCaptionTrack) => t.name.simpleText.includes(lang));
        if (matchingTracks.length === 0) {
            return c.json({ error: `No manual subtitles found for language target '${lang}'` }, 400);
        }

        const manualTrack = matchingTracks.find((t: YouTubeCaptionTrack) => t.name.simpleText.toLowerCase() === lang.toLowerCase());
        const selectedTrack = manualTrack || matchingTracks[0];
        exactLangName = selectedTrack.name.simpleText;

        subtitles = await getSubtitles({ videoID: vid_id, lang: selectedTrack.languageCode });
    }
    
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
    const safeFilename = encodeURIComponent(baseFilename).replace(/['()]/g, escape).replace(/\*/g, '%2A');

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
