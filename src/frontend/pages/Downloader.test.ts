import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Downloader from './Downloader.vue';
import { toast } from 'vue3-toastify';

// Mock router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock toast
vi.mock('vue3-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('Downloader.vue Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('navigates to preview page on valid youtube URL input via handleDownload', async () => {
    const wrapper = mount(Downloader, {
      global: {
        stubs: {
          DownloaderHero: {
            template: '<button @click="$emit(\'download\', \'https://www.youtube.com/watch?v=dQw4w9WgXcQ\')">Download</button>'
          }
        }
      }
    });

    await wrapper.find('button').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/preview?vid_id=dQw4w9WgXcQ');
  });

  it('navigates to preview page on valid short youtube URL', async () => {
    const wrapper = mount(Downloader, {
      global: {
        stubs: {
          DownloaderHero: {
            template: '<button @click="$emit(\'download\', \'https://youtu.be/dQw4w9WgXcQ\')">Download</button>'
          }
        }
      }
    });

    await wrapper.find('button').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/preview?vid_id=dQw4w9WgXcQ');
  });

  it('triggers toast error on invalid url structure', async () => {
    const wrapper = mount(Downloader, {
      global: {
        stubs: {
          DownloaderHero: {
            template: '<button @click="$emit(\'download\', \'invalid-url\')">Download</button>'
          }
        }
      }
    });

    await wrapper.find('button').trigger('click');
    expect(toast.error).toHaveBeenCalledWith('errors.invalid_url');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('triggers toast error when youtube video ID is missing in URL', async () => {
    const wrapper = mount(Downloader, {
      global: {
        stubs: {
          DownloaderHero: {
            template: '<button @click="$emit(\'download\', \'https://www.youtube.com/watch?x=abc\')">Download</button>'
          }
        }
      }
    });

    await wrapper.find('button').trigger('click');
    expect(toast.error).toHaveBeenCalledWith('errors.invalid_youtube_url');
    expect(mockPush).not.toHaveBeenCalled();
  });
});
