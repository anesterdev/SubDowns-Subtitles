import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Downloader from './Downloader.vue';
import { toast } from 'vue3-toastify';

const mockPush = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock('vue3-toastify', () => ({ toast: { error: vi.fn() } }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

const mountPage = (url: string) =>
  mount(Downloader, {
    global: {
      stubs: {
        DownloaderHero: {
          template: `<button :data-disabled="disabled" @click="$emit('download', '${url}')">go</button>`,
          props: ['disabled'],
          emits: ['download'],
        },
      },
    },
  });

describe('Downloader.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockResolvedValue(undefined);
  });

  it('navigates to preview on valid youtube URL', async () => {
    await mountPage('https://www.youtube.com/watch?v=dQw4w9WgXcQ').find('button').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/preview?vid_id=dQw4w9WgXcQ');
  });

  it('navigates on valid short youtube URL', async () => {
    await mountPage('https://youtu.be/dQw4w9WgXcQ').find('button').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/preview?vid_id=dQw4w9WgXcQ');
  });

  it('shows invalid_url toast for malformed URL', async () => {
    await mountPage('invalid-url').find('button').trigger('click');
    expect(toast.error).toHaveBeenCalledWith('errors.invalid_url');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows invalid_youtube_url toast when video id is missing', async () => {
    await mountPage('https://www.youtube.com/watch?x=abc').find('button').trigger('click');
    expect(toast.error).toHaveBeenCalledWith('errors.invalid_youtube_url');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('disables hero while navigating', async () => {
    const wrapper = mountPage('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    await wrapper.find('button').trigger('click');
    expect(wrapper.find('button').attributes('data-disabled')).toBe('true');
  });
});
