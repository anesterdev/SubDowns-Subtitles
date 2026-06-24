import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDownload } from './useDownload.ts';
import { toast } from 'vue3-toastify';

// Mock videoStore
const mockSaveToHistory = vi.fn();
vi.mock('../stores/videoStore.ts', () => ({
  useVideoStore: () => ({
    saveToHistory: mockSaveToHistory,
  }),
}));

// Mock toast
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
    await downloadSubs('dQw4w9WgXcQ', 'English', 'srt', 'manual');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v0/download?vid_id=dQw4w9WgXcQ&lang=English&format=srt&type=manual'
    );
    expect(createdElement.download).toBe('rick-astley-subtitles.srt');
    expect(createdElement.href).toBe('blob-url');
    expect(clicked).toBe(true);
    expect(appended).toBe(true);
    expect(removed).toBe(true);
    expect(mockSaveToHistory).toHaveBeenCalledWith('English', 'srt', 'manual', 'rick-astley-subtitles.srt');
  });

  it('parses RFC 5987 / UTF-8 encoded filename from Content-Disposition header correctly', async () => {
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
    await downloadSubs('dQw4w9WgXcQ', 'English', 'txt', 'manual');

    expect(createdElement.download).toBe('Never Gonna Give You Up.txt');
    expect(mockSaveToHistory).toHaveBeenCalledWith('English', 'txt', 'manual', 'Never Gonna Give You Up.txt');
  });

  it('falls back to default filename when Content-Disposition is missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => null,
      },
      blob: async () => new Blob(['raw data'], { type: 'application/json' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { downloadSubs } = useDownload();
    await downloadSubs('dQw4w9WgXcQ', 'Spanish', 'raw', 'auto');

    expect(createdElement.download).toBe('subtitles.raw');
  });

  it('displays error toast when download request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Video blocked in your country' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    void consoleErrorSpy;

    const { downloadSubs } = useDownload();
    await downloadSubs('dQw4w9WgXcQ', 'English', 'srt', 'manual');

    expect(toast.error).toHaveBeenCalledWith('Video blocked in your country');
    expect(clicked).toBe(false);
  });
});
