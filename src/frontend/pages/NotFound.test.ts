import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import NotFound from './NotFound.vue';

// Mock i18n global translator
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('NotFound.vue Page', () => {
  it('renders illustration and text fields with correct translation keys', () => {
    const wrapper = mount(NotFound, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
        mocks: {
          $t: (key: string) => key,
        }
      }
    });

    expect(wrapper.find('.title').text()).toBe('not_found.title');
    expect(wrapper.find('.description').text()).toBe('not_found.description');
    
    // Check CC NOT FOUND text in SVG
    expect(wrapper.find('.badge-text').text()).toBe('CC NOT FOUND');
    
    // Router link checks
    const routerLink = wrapper.find('.back-link');
    expect(routerLink.exists()).toBe(true);
    expect(routerLink.text()).toContain('not_found.back_home');
  });
});
