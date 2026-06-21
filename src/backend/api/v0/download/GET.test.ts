import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../../server.ts';
import * as utils from '../../../../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';
import { YouTubePlayerResponse } from '../../../../interfaces/YouTube.ts';

// Mock the utilities and external subtitle extractor
vi.mock('../../../../utils/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../utils/index.ts')>();
  return {
    ...actual,
    fetchMetadata: vi.fn(),
    fetchAutoSubtitles: vi.fn(),
  };
});

vi.mock('youtube-caption-extractor', () => ({
  getSubtitles: vi.fn(),
}));

describe('GET /api/v0/download', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if vid_id query param is missing or invalid', async () => {
    const res = await app.request('/api/v0/download?lang=English&format=srt');
    expect(res.status).toBe(400);
  });

  it('should return 400 if lang query param is missing', async () => {
    const res = await app.request('/api/v0/download?vid_id=dQw4w9WgXcQ&format=srt');
    expect(res.status).toBe(400);
  });

  it('should successfully return manual subtitles formatted as SRT', async () => {
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
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              baseUrl: 'https://video.google.com/timedtext?v=dQw4w9WgXcQ',
              name: { simpleText: 'English' },
              languageCode: 'en',
              vssId: '.en',
              isTranslatable: true,
              isDefault: true
            }
          ]
        }
      }
    };

    const mockSubtitles = [
      { start: '1.0', dur: '2.0', text: 'We are no strangers to love' }
    ];

    vi.mocked(utils.fetchMetadata).mockResolvedValue(mockPlayerResponse);
    vi.mocked(getSubtitles).mockResolvedValue(mockSubtitles);

    const res = await app.request('/api/v0/download?vid_id=dQw4w9WgXcQ&lang=English&format=srt');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    
    const text = await res.text();
    expect(text).toContain('1\n00:00:01,000 --> 00:00:03,000\nWe are no strangers to love');
  });

  it('should successfully return auto-translated subtitles', async () => {
    const mockPlayerResponse: YouTubePlayerResponse = {
      videoDetails: {
        title: 'Test Video',
        author: 'Test Author',
        channelId: 'TestChannel',
        lengthSeconds: '100'
      },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            {
              baseUrl: 'https://base.url',
              name: { simpleText: 'English' },
              languageCode: 'en',
              vssId: '.en',
              isTranslatable: true,
              isDefault: true
            }
          ],
          translationLanguages: [
            { languageCode: 'es', languageName: { simpleText: 'Spanish' } }
          ]
        }
      }
    };

    const mockSubtitles = [
      { start: '1.5', dur: '1.5', text: 'Hola Mundo' }
    ];

    vi.mocked(utils.fetchMetadata).mockResolvedValue(mockPlayerResponse);
    vi.mocked(utils.fetchAutoSubtitles).mockResolvedValue(mockSubtitles);

    const res = await app.request('/api/v0/download?vid_id=dQw4w9WgXcQ&lang=Spanish&format=txt&type=auto');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');

    const text = await res.text();
    expect(text).toBe('Hola Mundo');
  });
});
