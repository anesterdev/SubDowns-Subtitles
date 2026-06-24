import { describe, it, expect, vi, beforeEach } from 'vitest';
import { selectCaptionTrack, fetchAutoSubtitles, decodeHtmlEntities, fetchSubtitles } from '../subtitles.ts';
import { fetchMetadata } from '../metadata.ts';
import { getSubtitles } from 'youtube-caption-extractor';
import { YouTubeCaptionTrack, YouTubePlayerResponse } from '../../interfaces/YouTube.ts';

vi.mock('../metadata.ts', () => ({
  fetchMetadata: vi.fn(),
}));

vi.mock('youtube-caption-extractor', () => ({
  getSubtitles: vi.fn(),
}));

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

describe('decodeHtmlEntities', () => {
  it('strips HTML tags and decodes named, numeric decimal, and hex entities', () => {
    expect(decodeHtmlEntities('<b>Hello</b> &amp; Welcome&#39;s &#x27;Great&#x27;'))
      .toBe("Hello & Welcome's 'Great'");
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
      expect.objectContaining({ headers: { 'User-Agent': 'Mozilla/5.0' } })
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

describe('fetchSubtitles', () => {
  const mockTracks: YouTubeCaptionTrack[] = [
    { baseUrl: 'https://timedtext?v=123&fmt=srv3', name: { simpleText: 'English' }, vssId: '.en', languageCode: 'en', isTranslatable: true, isDefault: true },
    { baseUrl: 'https://timedtext?v=123&fmt=srv3&lang=es', name: { simpleText: 'Spanish' }, vssId: '.es', languageCode: 'es', isTranslatable: true },
  ];

  const mockPlayerResponse = {
    videoDetails: { title: 'Test Video', author: 'Author', channelId: 'cid', lengthSeconds: '10' },
    captions: {
      playerCaptionsTracklistRenderer: {
        captionTracks: mockTracks,
        translationLanguages: [
          { languageCode: 'es', languageName: { simpleText: 'Spanish' } },
          { languageCode: 'fr', languageName: { simpleText: 'French' } },
        ],
      },
    },
  } as YouTubePlayerResponse;

  beforeEach(() => {
    vi.mocked(fetchMetadata).mockReset();
    vi.mocked(getSubtitles).mockReset();
    vi.unstubAllGlobals();
  });

  it('throws when metadata is not found', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue(null);
    await expect(fetchSubtitles('dQw4w9WgXcQ', 'English'))
      .rejects.toThrow('Video metadata not found or unavailable');
  });

  it('throws when no caption tracks are available', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue({
      videoDetails: { title: 'Test', author: 'A', channelId: 'c', lengthSeconds: '10' },
    } as YouTubePlayerResponse);
    await expect(fetchSubtitles('dQw4w9WgXcQ', 'English'))
      .rejects.toThrow('No subtitles available for this video');
  });

  it('fetches manual subtitles via getSubtitles', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue(mockPlayerResponse);
    vi.mocked(getSubtitles).mockResolvedValue([{ start: '1', dur: '2', text: 'Hello' }]);

    const result = await fetchSubtitles('dQw4w9WgXcQ', 'English', { type: 'manual' });

    expect(result.title).toBe('Test Video');
    expect(result.exactLangName).toBe('English');
    expect(result.subtitles).toEqual([{ start: '1', dur: '2', text: 'Hello' }]);
    expect(getSubtitles).toHaveBeenCalledWith({ videoID: 'dQw4w9WgXcQ', lang: 'en' });
  });

  it('throws when no manual track matches and fallback is disabled', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue(mockPlayerResponse);

    await expect(fetchSubtitles('dQw4w9WgXcQ', 'Klingon', { type: 'manual', allowFallback: false }))
      .rejects.toThrow("No manual subtitles found for language target 'Klingon'");
  });

  it('fetches auto-translated subtitles via fetchAutoSubtitles', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue(mockPlayerResponse);

    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'Hola' }] }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchSubtitles('dQw4w9WgXcQ', 'Spanish', { type: 'auto' });

    expect(result.exactLangName).toBe('Spanish');
    expect(result.subtitles).toHaveLength(1);
    expect(result.subtitles[0].text).toBe('Hola');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://timedtext?v=123&fmt=json3&tlang=es',
      expect.objectContaining({ headers: { 'User-Agent': 'Mozilla/5.0' } })
    );
  });

  it('throws when auto-translate language is not found', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue(mockPlayerResponse);

    await expect(fetchSubtitles('dQw4w9WgXcQ', 'Klingon', { type: 'auto' }))
      .rejects.toThrow("Auto-translate language not found: 'Klingon'");
  });

  it('sanitizes title by stripping filesystem-unsafe characters', async () => {
    vi.mocked(fetchMetadata).mockResolvedValue({
      ...mockPlayerResponse,
      videoDetails: { title: 'Title: with <bad> chars? and "quotes"', author: 'A', channelId: 'c', lengthSeconds: '10' },
    } as YouTubePlayerResponse);
    vi.mocked(getSubtitles).mockResolvedValue([]);

    const result = await fetchSubtitles('dQw4w9WgXcQ', 'English');

    expect(result.title).toBe('Title with bad chars and quotes');
  });
});
