import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Preview from './Preview.vue';
import { reactive } from 'vue';

// Mock router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRoute: () => ({
    query: { vid_id: 'dQw4w9WgXcQ' },
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock store
const mockFetchVideo = vi.fn();
const mockVideoStore = reactive({
  status: 'Idle',
  currentVideo: null as null | Record<string, unknown>,
  fetchVideo: mockFetchVideo,
});
vi.mock('../stores/videoStore.ts', () => ({
  useVideoStore: () => mockVideoStore,
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('Preview.vue Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mockVideoStore.status = 'Idle';
    mockVideoStore.currentVideo = null;
  });

  it('triggers store fetchVideo on mounted', () => {
    mount(Preview, {
      global: {
        stubs: {
          VideoPreviewIsland: true,
          SubtitlesList: true,
        },
      },
    });

    expect(mockFetchVideo).toHaveBeenCalledWith('dQw4w9WgXcQ');
  });

  it('renders layout and components when state is Fetching or Ready', () => {
    mockVideoStore.status = 'Fetching';
    const wrapper = mount(Preview, {
      global: {
        stubs: {
          VideoPreviewIsland: { template: '<div class="preview-island">Island</div>' },
          SubtitlesList: { template: '<div class="subtitles-list">List</div>' },
        },
      },
    });

    expect(wrapper.find('.preview-layout').exists()).toBe(true);
    expect(wrapper.findAll('.subtitles-list').length).toBe(2);
  });

  it('renders error block and handles navigation when store has error status', async () => {
    mockVideoStore.status = 'Error';
    const wrapper = mount(Preview, {
      global: {
        stubs: {
          VideoPreviewIsland: true,
          SubtitlesList: true,
        },
      },
    });

    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.error').text()).toContain('preview.error_fetching');

    await wrapper.find('.error button').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
