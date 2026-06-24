import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDownload } from './useDownload.ts';
import { toast } from 'vue3-toastify';
import type { DownloadTarget } from '../../interfaces/index.ts';

const mockSaveToHistory = vi.fn();
const mockIsDownloading = vi.fn(() => false);
const mockSetDownloading = vi.fn();
vi.mock('../stores/videoStore.ts', () => ({
  useVideoStore: () => ({
    saveToHistory: mockSaveToHistory,
    isDownloading: mockIsDownloading,
    setDownloading: mockSetDownloading,
  }),
}));

vi.mock('vue3-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

interface MockAnchorElement {
  href: string;
  download: string;
  click: () => void;
}

describe('useDownload Composable', () => {
  let createdElement: MockAnchorElement;
  let clicked = false;
  let appended = false;
  let removed = false;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockSaveToHistory.mockReset();
    mockSetDownloading.mockReset();
    mockIsDownloading.mockReset();
    mockIsDownloading.mockReturnValue(false);
    clicked = false;
    appended = false;
    removed = false;
    createdElement = {
      href: '',
      download: '',
      click: () => {
        clicked = true;
      },
    };

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob-url'),
      revokeObjectURL: vi.fn(),
    });

    vi.stubGlobal('document', {
      createElement: vi.fn().mockReturnValue(createdElement),
      body: {
        appendChild: vi.fn().mockImplementation(() => {
          appended = true;
        }),
        removeChild: vi.fn().mockImplementation(() => {
          removed = true;
        }),
      },
    });
  });

  it('parses standard filename from Content-Disposition header correctly', async () => {
    const target: DownloadTarget = { vidId: 'dQw4w9WgXcQ', lang: 'English', format: 'srt', type: 'manual' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'content-disposition') {
            return 'attachment; filename="rick-astley-subtitles.srt"';
          }
          return null;
        },
      },
      blob: async () => new Blob(['subtitles content'], { type: 'text/plain' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { downloadSubs } = useDownload();
    await downloadSubs(target);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v0/download?vid_id=dQw4w9WgXcQ&lang=English&format=srt&type=manual'
    );
    expect(createdElement.download).toBe('rick-astley-subtitles.srt');
    expect(createdElement.href).toBe('blob-url');
    expect(clicked).toBe(true);
    expect(appended).toBe(true);
    expect(removed).toBe(true);
    expect(mockSaveToHistory).toHaveBeenCalledWith('English', 'srt', 'manual', 'rick-astley-subtitles.srt');
    expect(mockSetDownloading).toHaveBeenNthCalledWith(1, target, true);
    expect(mockSetDownloading).toHaveBeenLastCalledWith(target, false);
  });

  it('parses RFC 5987 / UTF-8 encoded filename from Content-Disposition header correctly', async () => {
    const target: DownloadTarget = { vidId: 'dQw4w9WgXcQ', lang: 'English', format: 'txt', type: 'manual' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'content-disposition') {
            return "attachment; filename*=UTF-8''Never%20Gonna%20Give%20You%20Up.txt";
          }
          return null;
        },
      },
      blob: async () => new Blob(['subtitles content'], { type: 'text/plain' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { downloadSubs } = useDownload();
    await downloadSubs(target);

    expect(createdElement.download).toBe('Never Gonna Give You Up.txt');
    expect(mockSaveToHistory).toHaveBeenCalledWith('English', 'txt', 'manual', 'Never Gonna Give You Up.txt');
  });

  it('falls back to default filename when Content-Disposition is missing', async () => {
    const target: DownloadTarget = { vidId: 'dQw4w9WgXcQ', lang: 'Spanish', format: 'raw', type: 'auto' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      blob: async () => new Blob(['raw data'], { type: 'application/json' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { downloadSubs } = useDownload();
    await downloadSubs(target);

    expect(createdElement.download).toBe('subtitles.raw');
  });

  it('displays error toast when download request fails', async () => {
    const target: DownloadTarget = { vidId: 'dQw4w9WgXcQ', lang: 'English', format: 'srt', type: 'manual' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Video blocked in your country' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    void consoleErrorSpy;

    const { downloadSubs } = useDownload();
    await downloadSubs(target);

    expect(toast.error).toHaveBeenCalledWith('Video blocked in your country');
    expect(clicked).toBe(false);
    expect(mockSetDownloading).toHaveBeenLastCalledWith(target, false);
  });
});
