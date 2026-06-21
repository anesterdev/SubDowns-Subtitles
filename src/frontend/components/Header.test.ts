import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Header from './Header.vue';
import { loadLocale } from '../i18n.ts';

// Mock dependencies
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: { value: 'en' },
    t: (key: string) => key,
  }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: { titleKey: 'page.home' },
  }),
}));

vi.mock('../i18n.ts', () => ({
  default: {
    global: {
      t: (key: string) => key,
    },
  },
  loadLocale: vi.fn(),
}));

vi.mock('../constants/index.ts', () => ({
  APP_TITLE: 'SubDowns',
}));

describe('Header.vue Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.className = '';
    localStorage.clear();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders the brand title correctly', () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': true,
        },
      },
    });

    expect(wrapper.find('.header-brand').text()).toContain('SubDowns');
  });

  it('toggles theme on click and updates document.body and localStorage', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': true,
        },
      },
    });

    const button = wrapper.find('.theme-toggle');
    expect(document.body.classList.contains('theme-white')).toBe(false);

    // Toggle theme to light
    await button.trigger('click');
    expect(document.body.classList.contains('theme-white')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('light');

    // Toggle theme back to dark
    await button.trigger('click');
    expect(document.body.classList.contains('theme-white')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('auto');
  });

  it('handles language changes correctly', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          'router-link': true,
        },
      },
    });

    const select = wrapper.find('.lang-select');
    await select.setValue('es');

    expect(loadLocale).toHaveBeenCalledWith('es');
  });
});
