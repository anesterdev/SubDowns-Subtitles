import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from '../../../../server.ts';
import * as utils from '../../../../../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';
import { YouTubePlayerResponse } from '../../../../../interfaces/YouTube.ts';

// Mock the utilities and external subtitle extractor
vi.mock('../../../../../utils/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../utils/index.ts')>();
  return {
    ...actual,
    fetchMetadata: vi.fn(),
  };
});

vi.mock('youtube-caption-extractor', () => ({
  getSubtitles: vi.fn(),
}));

describe('GET /api/v0/download/raw', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 if vid_id query param is missing or invalid', async () => {
    const res = await app.request('/api/v0/download/raw');
    expect(res.status).toBe(400);

    const invalidRes = await app.request('/api/v0/download/raw?vid_id=invalid');
    expect(invalidRes.status).toBe(400);
  });

  it('should successfully return plain text raw subtitles', async () => {
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
          ]
        }
      }
    };

    const mockSubtitles = [
      { start: '1.0', dur: '2.0', text: 'Hello' },
      { start: '3.0', dur: '1.0', text: 'World' }
    ];

    vi.mocked(utils.fetchMetadata).mockResolvedValue(mockPlayerResponse);
    vi.mocked(getSubtitles).mockResolvedValue(mockSubtitles);

    const res = await app.request('/api/v0/download/raw?vid_id=dQw4w9WgXcQ&lang=English');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');

    const text = await res.text();
    expect(text).toBe('Hello\nWorld');
  });
});
