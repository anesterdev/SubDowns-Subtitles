import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import SubtitlesList from './SubtitlesList.vue';
import { ref } from 'vue';

// Mock store
vi.mock('../stores/videoStore.ts', () => ({
  useVideoStore: () => ({}),
}));

// Mock useDownload composable
const mockDownloadSubs = vi.fn();
const mockOpenRawTab = vi.fn();
vi.mock('../composables/useDownload.ts', () => ({
  useDownload: () => ({
    isDownloading: ref({}),
    downloadSubs: mockDownloadSubs,
    openRawTab: mockOpenRawTab,
  }),
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('SubtitlesList.vue Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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

    // SRT button
    await wrapper.find('.col-actions button').trigger('click');
    expect(mockDownloadSubs).toHaveBeenCalledWith('dQw4w9WgXcQ', 'English', 'srt', 'manual');
  });
});
