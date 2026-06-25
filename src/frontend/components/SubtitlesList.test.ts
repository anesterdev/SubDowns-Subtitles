import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SubtitlesList from './SubtitlesList.vue';

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

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('SubtitlesList.vue Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockDownloadSubs.mockReset();
    mockOpenRawTab.mockReset();
    mockIsDownloading.mockReset();
    mockIsDownloading.mockReturnValue(false);
  });

  it('renders loading skeleton rows when loading is true', () => {
    const wrapper = mount(SubtitlesList, {
      props: {
        title: 'Manual Subtitles',
        icon: 'subtitles',
        videoId: 'dQw4w9WgXcQ',
        type: 'manual',
        loading: true,
        skeletonCount: 3,
      },
    });

    expect(wrapper.findAll('.list-row').length).toBe(3);
  });

  it('renders language list and headers when data is loaded', () => {
    const wrapper = mount(SubtitlesList, {
      props: {
        title: 'Manual Subtitles',
        icon: 'subtitles',
        videoId: 'dQw4w9WgXcQ',
        type: 'manual',
        languages: ['English', 'Spanish'],
        loading: false,
      },
    });

    expect(wrapper.find('.title').text()).toBe('Manual Subtitles');
    expect(wrapper.findAll('.list-row').length).toBe(2);
    expect(wrapper.findAll('.lang-name')[0].text()).toBe('English');
    expect(wrapper.findAll('.lang-name')[1].text()).toBe('Spanish');
  });

  it('shows empty state description when languages array is empty', () => {
    const wrapper = mount(SubtitlesList, {
      props: {
        title: 'Manual Subtitles',
        icon: 'subtitles',
        videoId: 'dQw4w9WgXcQ',
        type: 'manual',
        languages: [],
        loading: false,
      },
    });

    expect(wrapper.find('.empty-state').exists()).toBe(true);
    expect(wrapper.find('.empty-state').text()).toBe('subtitles.no_languages');
  });

  it('triggers download actions correctly on language row click', async () => {
    const wrapper = mount(SubtitlesList, {
      props: {
        title: 'Manual Subtitles',
        icon: 'subtitles',
        videoId: 'dQw4w9WgXcQ',
        type: 'manual',
        languages: ['English'],
        loading: false,
      },
    });

    await wrapper.find('.col-actions button').trigger('click');
    expect(mockDownloadSubs).toHaveBeenCalledWith({
      vidId: 'dQw4w9WgXcQ',
      lang: 'English',
      format: 'srt',
      type: 'manual',
    });
  });
});
