import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import VideoPreviewIsland from './VideoPreviewIsland.vue';

const mockDownloadSubs = vi.fn();
const mockOpenRawTab = vi.fn();
const mockIsDownloading = vi.fn(() => false);

vi.mock('../composables/useDownload.ts', () => ({
  useDownload: () => ({
    isDownloading: mockIsDownloading,
    downloadSubs: mockDownloadSubs,
    openRawTab: mockOpenRawTab,
  }),
}));

describe('VideoPreviewIsland.vue Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDownloadSubs.mockReset();
    mockOpenRawTab.mockReset();
    mockIsDownloading.mockReset();
    mockIsDownloading.mockReturnValue(false);
  });

  it('renders skeleton states when loading is true', () => {
    const wrapper = mount(VideoPreviewIsland, {
      props: {
        loading: true,
      },
    });

    expect(wrapper.find('.thumbnail-wrapper').classes()).toContain('skeleton');
    expect(wrapper.find('.title').classes()).toContain('skeleton');
  });

  it('renders video details correctly when metadata is present', () => {
    const video = {
      title: 'Never Gonna Give You Up',
      video_id: 'dQw4w9WgXcQ',
      created_at: '2009-10-25',
      thumbnail_url: 'https://thumbnail.url',
      duration: '212',
    };

    const author = {
      channel_name: 'Rick Astley',
      channel_id: 'UCuAXFkgcl1yWxqiHs95V9hw',
    };

    const subtitles = {
      available_languages: ['English'],
      auto_translate_languages: ['Spanish'],
      count: 1,
    };

    const wrapper = mount(VideoPreviewIsland, {
      props: {
        video,
        author,
        subtitles,
        loading: false,
      },
    });

    expect(wrapper.find('.title').text()).toBe('Never Gonna Give You Up');
    expect(wrapper.find('.lang-name').text()).toBe('English');
    expect(wrapper.text()).toContain('Rick Astley');
    expect(wrapper.text()).toContain('03:32');
    expect(wrapper.find('.thumbnail-wrapper').attributes('href')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(wrapper.find('.thumbnail-wrapper').attributes('target')).toBe('_blank');
    expect(wrapper.find('.detail-item').attributes('href')).toBe('https://www.youtube.com/channel/UCuAXFkgcl1yWxqiHs95V9hw');
  });

  it('triggers download actions correctly on button click', async () => {
    const video = {
      title: 'Never Gonna Give You Up',
      video_id: 'dQw4w9WgXcQ',
      created_at: '2009-10-25',
      thumbnail_url: 'https://thumbnail.url',
      duration: '212',
    };

    const subtitles = {
      available_languages: ['English'],
      auto_translate_languages: [],
      count: 1,
    };

    const wrapper = mount(VideoPreviewIsland, {
      props: {
        video,
        subtitles,
        loading: false,
      },
    });

    const srtButton = wrapper.find('.actions button');
    await srtButton.trigger('click');

    expect(mockDownloadSubs).toHaveBeenCalledWith({
      vidId: 'dQw4w9WgXcQ',
      lang: 'English',
      format: 'srt',
      type: 'manual',
    });
  });
});
