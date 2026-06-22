import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectCaptionTrack, fetchAutoSubtitles } from '../subtitles.ts';
import { YouTubeCaptionTrack } from '../../interfaces/YouTube.ts';

describe('selectCaptionTrack', () => {
  const mockTracks: YouTubeCaptionTrack[] = [
    { baseUrl: 'url-en', name: { simpleText: 'English' }, vssId: '.en', languageCode: 'en', isTranslatable: true },
    { baseUrl: 'url-es', name: { simpleText: 'Spanish' }, vssId: '.es', languageCode: 'es', isTranslatable: true },
    { baseUrl: 'url-zh', name: { simpleText: 'Chinese' }, vssId: '.zh', languageCode: 'zh', isTranslatable: true },
  ];

  it('returns null if tracks list is empty or undefined', () => {
    expect(selectCaptionTrack([], 'English')).toBeNull();
    expect(selectCaptionTrack(undefined as unknown as YouTubeCaptionTrack[], 'English')).toBeNull();
  });

  it('matches language name exactly (case insensitive)', () => {
    const track = selectCaptionTrack(mockTracks, 'spanish');
    expect(track).toBeDefined();
    expect(track?.name.simpleText).toBe('Spanish');
  });

  it('matches language name partially', () => {
    const track = selectCaptionTrack(mockTracks, 'span');
    expect(track).toBeDefined();
    expect(track?.name.simpleText).toBe('Spanish');
  });

  it('falls back to English when no match is found and fallback is allowed', () => {
    const track = selectCaptionTrack(mockTracks, 'Russian', true);
    expect(track).toBeDefined();
    expect(track?.name.simpleText).toBe('English');
  });

  it('falls back to first track when no English track exists and fallback is allowed', () => {
    const tracksWithoutEn = mockTracks.filter(t => t.languageCode !== 'en');
    const track = selectCaptionTrack(tracksWithoutEn, 'Russian', true);
    expect(track).toBeDefined();
    expect(track?.name.simpleText).toBe('Spanish');
  });

  it('returns null when no match is found and fallback is disabled', () => {
    const track = selectCaptionTrack(mockTracks, 'Russian', false);
    expect(track).toBeNull();
  });
});

describe('fetchAutoSubtitles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses valid json3 subtitle events successfully', async () => {
    const mockJson3 = {
      events: [
        {
          tStartMs: 1000,
          dDurationMs: 2000,
          segs: [
            { utf8: 'Hello ' },
            { utf8: 'World' }
          ]
        },
        {
          tStartMs: 4000,
          dDurationMs: 1500,
          segs: [
            { utf8: 'Second segment' }
          ]
        }
      ]
    };

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockJson3,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAutoSubtitles('https://youtube.com/api?v=123', 'es');
    
    expect(fetchMock).toHaveBeenCalledWith(
      'https://youtube.com/api?v=123&fmt=json3&tlang=es',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      start: '1',
      dur: '2',
      text: 'Hello World'
    });
    expect(result[1]).toEqual({
      start: '4',
      dur: '1.5',
      text: 'Second segment'
    });
  });

  it('filters out segment formatting tags and decodes entities', async () => {
    const mockJson3 = {
      events: [
        {
          tStartMs: 0,
          dDurationMs: 1000,
          segs: [
            { utf8: '<b>Hello</b> &amp; Welcome&#39;s' }
          ]
        }
      ]
    };

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockJson3,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAutoSubtitles('https://youtube.com/api?v=123', 'es');
    expect(result[0].text).toBe("Hello & Welcome's");
  });

  it('ignores events with aAppend equal to 1 or empty segments', async () => {
    const mockJson3 = {
      events: [
        {
          tStartMs: 0,
          dDurationMs: 1000,
          aAppend: 1,
          segs: [{ utf8: 'Appended text' }]
        },
        {
          tStartMs: 2000,
          dDurationMs: 1000,
          segs: []
        },
        {
          tStartMs: 3000,
          dDurationMs: 1000,
          segs: [{ utf8: '   ' }] // spaces should be trimmed and ignored if empty
        }
      ]
    };

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockJson3,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchAutoSubtitles('https://youtube.com/api?v=123', 'es');
    expect(result).toHaveLength(0);
  });

  it('throws an error with message for HTTP 429', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 429,
      ok: false,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAutoSubtitles('https://youtube.com/api?v=123', 'es'))
      .rejects.toThrow('YouTube blocked the auto-translate request (Error 429 Too Many Requests)');
  });

  it('throws an error for non-ok statuses other than 429', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAutoSubtitles('https://youtube.com/api?v=123', 'es'))
      .rejects.toThrow('Caption fetch failed: 500');
  });
});
