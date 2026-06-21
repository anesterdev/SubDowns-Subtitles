import { describe, it, expect, vi, beforeEach } from 'vitest';
import app from './server.ts';
import * as utils from '../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';

vi.mock('./config.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./config.ts')>();
  return {
    config: {
      ...actual.config,
      TRUST_PROXY: true,
      RATE_LIMIT_MAX: 2,
      RATE_LIMIT_WINDOW_MS: 10000,
    }
  };
});

vi.mock('../utils/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/index.ts')>();
  return {
    ...actual,
    fetchSubtitles: vi.fn(),
  };
});

vi.mock('youtube-caption-extractor', () => ({
  getSubtitles: vi.fn(),
}));

describe('Server Global Endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 OK status', async () => {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
      
      const body = await res.json();
      expect(body).toEqual({ status: 'ok' });
    });
  });

  describe('Rate Limiter', () => {
    it('should block requests after exceeding RATE_LIMIT_MAX', async () => {
      // Mock an IP to ensure consistency
      const makeReq = () => app.request('/api/health', {
        headers: {
          'x-forwarded-for': '1.2.3.4'
        }
      });
      
      const res1 = await makeReq();
      expect(res1.status).toBe(200);
      
      const res2 = await makeReq();
      expect(res2.status).toBe(200);
      
      const res3 = await makeReq();
      expect(res3.status).toBe(429);
      const body = await res3.json();
      expect(body).toEqual({ error: 'Too many requests, please try again later.' });
    });
  });

  describe('E2E Download Flow', () => {
    it('should return SRT subtitles successfully', async () => {
      const mockSubtitles = [{ start: '1.0', dur: '1.0', text: 'Hello World' }];

      vi.mocked(utils.fetchSubtitles).mockResolvedValue({
        title: 'Test Video',
        exactLangName: 'English',
        subtitles: mockSubtitles
      });

      // Using IP 1.2.3.5 to avoid rate limit from previous test
      const res = await app.request('/api/v0/download?vid_id=dQw4w9WgXcQ&lang=English&format=srt&type=manual', {
        headers: { 'x-forwarded-for': '1.2.3.5' }
      });

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/plain');
      const text = await res.text();
      expect(text).toContain('Hello World');
      expect(text).toContain('-->');
    });
  });
});
