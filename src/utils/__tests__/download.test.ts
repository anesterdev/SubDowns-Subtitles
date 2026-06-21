import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadSubtitles } from '../../../download.ts';
import fs from 'fs';
import * as utils from '../../utils/index.ts';
import { getSubtitles } from 'youtube-caption-extractor';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  }
}));

vi.mock('../../utils/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/index.ts')>();
  return {
    ...actual,
    fetchMetadata: vi.fn(),
  };
});

vi.mock('youtube-caption-extractor', () => ({
  getSubtitles: vi.fn(),
}));

describe('CLI downloadSubtitles', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should print error if links file does not exist', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(fs.existsSync).mockReturnValue(false);

    await downloadSubtitles('nonexistent.json');

    expect(logSpy).toHaveBeenCalledWith('✗ Error: Could not find nonexistent.json');
  });

  it('should parse urls, retrieve tracks, and write files', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(['https://www.youtube.com/watch?v=dQw4w9WgXcQ']));

    const mockPlayerResponse = {
      videoDetails: { title: 'Test Video', author: 'Test Channel', channelId: '123', lengthSeconds: '10', thumbnail: { thumbnails: [{ url: 'thumb' }] } },
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: 'https://base.url', name: { simpleText: 'English' }, languageCode: 'en', vssId: '.en', isTranslatable: true }
          ]
        }
      }
    };
    const mockSubtitles = [{ start: '1.0', dur: '1.0', text: 'Hello CLI' }];

    vi.mocked(utils.fetchMetadata).mockResolvedValue(mockPlayerResponse as any);
    vi.mocked(getSubtitles).mockResolvedValue(mockSubtitles);

    await downloadSubtitles('links.json', 'custom-meta');

    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✓ Saved:'));
  });
});
