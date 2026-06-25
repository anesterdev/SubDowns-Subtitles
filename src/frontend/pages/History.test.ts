import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import History from './History.vue';

// Mock router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Mock history service
const { mockLoadHistoryEntries } = vi.hoisted(() => ({
  mockLoadHistoryEntries: vi.fn(),
}));
vi.mock('../services/historyService.ts', () => ({
  loadHistoryEntries: mockLoadHistoryEntries,
}));

describe('History.vue Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
    mockLoadHistoryEntries.mockResolvedValue([]);
  });

  it('shows loading state initially', async () => {
    const wrapper = mount(History);
    expect(wrapper.text()).toContain('history.loading');
  });

  it('shows empty state when no downloads in cache history', async () => {
    mockLoadHistoryEntries.mockResolvedValue([]);

    const wrapper = mount(History);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('history.empty');
  });

  it('renders history items and navigates on click', async () => {
    mockLoadHistoryEntries.mockResolvedValue([
      {
        videoId: 'dQw4w9WgXcQ',
        video: { title: 'Never Gonna Give You Up', thumbnail_url: 'https://thumbnail.url' },
        author: { channel_name: 'Rick Astley' },
        language: 'English',
        format: 'srt',
        type: 'manual',
        timestamp: 1624280400000,
      },
    ]);

    const wrapper = mount(History);
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Loading should be finished
    expect(wrapper.find('.loading-state').exists()).toBe(false);
    expect(wrapper.find('.video-card').exists()).toBe(true);
    expect(wrapper.find('.video-title').text()).toBe('Never Gonna Give You Up');
    expect(wrapper.find('.author').text()).toBe('Rick Astley');

    // Click on card
    await wrapper.find('.video-card').trigger('click');
    expect(mockPush).toHaveBeenCalledWith('/preview?vid_id=dQw4w9WgXcQ');
  });
});
