import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../../server.ts';
import * as utils from '../../../../utils/index.ts';
import { YouTubePlayerResponse } from '../../../../interfaces/YouTube.ts';

vi.mock('../../../../utils/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../utils/index.ts')>();
  return {
    ...actual,
    fetchMetadata: vi.fn(),
  };
});

describe('GET /api/v0/video-preview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if vid_id query param is missing or invalid', async () => {
    const res = await app.request('/api/v0/video-preview');
    expect(res.status).toBe(400);

    const invalidRes = await app.request('/api/v0/video-preview?vid_id=invalid');
    expect(invalidRes.status).toBe(400);
  });

  it('should return 404 if video is not found or playabilityStatus is ERROR', async () => {
    const mockPlayerResponse: YouTubePlayerResponse = {
      playabilityStatus: {
        status: 'ERROR',
        reason: 'Video is private'
      }
    };
    vi.mocked(utils.fetchMetadata).mockResolvedValue(mockPlayerResponse);

    const res = await app.request('/api/v0/video-preview?vid_id=dQw4w9WgXcQ');
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body).toEqual({ error: 'video_not_found' });
  });

  it('should successfully return video preview data', async () => {
    const mockPlayerResponse: YouTubePlayerResponse = {
      videoDetails: {
        title: 'Never Gonna Give You Up',
        author: 'Rick Astley',
        lengthSeconds: '212',
        channelId: 'UCuAXFkgcl1yWxqiHs95V9hw',
        thumbnail: {
          thumbnails: [{ url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg', width: 120, height: 90 }]
        }
      },
      microformat: {
        playerMicroformatRenderer: {
          publishDate: '2009-10-25'
        }
      },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              baseUrl: 'https://timedtext',
              name: { simpleText: 'English' },
              languageCode: 'en',
              vssId: '.en',
              isTranslatable: true
            },
            {
              baseUrl: 'https://timedtext-auto',
              name: { simpleText: 'English (auto-generated)' },
              languageCode: 'en',
              vssId: 'a.en',
              isTranslatable: true
            }
          ],
          translationLanguages: [
            { languageCode: 'es', languageName: { simpleText: 'Spanish' } }
          ]
        }
      }
    };

    vi.mocked(utils.fetchMetadata).mockResolvedValue(mockPlayerResponse);

    const res = await app.request('/api/v0/video-preview?vid_id=dQw4w9WgXcQ');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.video.title).toBe('Never Gonna Give You Up');
    expect(body.video.duration).toBe('212');
    expect(body.author.channel_name).toBe('Rick Astley');
    expect(body.subtitles.available_languages).toEqual(['English', 'English (auto-generated)']);
    expect(body.subtitles.auto_translate_languages).toEqual(['Spanish']);
    expect(body.subtitles.count).toBe(2);
  });
});
