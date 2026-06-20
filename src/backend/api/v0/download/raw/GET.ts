import { createRoute, z } from '@hono/zod-openapi';
import { fetchMetadata } from '../../../../../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';

export const route = createRoute({
  method: 'get',
  path: '/raw',
  request: {
    query: z.object({
      vid_id: z.string().openapi({ description: 'YouTube Video ID', example: 'dQw4w9WgXcQ' }),
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

export const handler = async (c: any) => {
  const { vid_id, lang } = c.req.valid('query');

  try {
    const playerResponse = await fetchMetadata(vid_id);
    if (!playerResponse) {
      return c.text('Video metadata not found', 400);
    }

    const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    if (tracks.length === 0) {
      return c.text('No subtitles available for this video', 400);
    }

    const matchingTracks = tracks.filter((t: any) => t.name.simpleText.toLowerCase().includes(lang.toLowerCase()));
    
    let selectedTrack;
    if (matchingTracks.length > 0) {
      selectedTrack = matchingTracks.find((t: any) => t.name.simpleText.toLowerCase() === lang.toLowerCase()) || matchingTracks[0];
    } else {
      selectedTrack = tracks[0];
    }

    const subtitles = await getSubtitles({ videoID: vid_id, lang: selectedTrack.languageCode });
    const content = subtitles.map((s: any) => s.text).join('\n');

    return c.text(content, 200);

  } catch (error: any) {
    return c.text(error.message || 'Failed to fetch subtitles', 400);
  }
};
