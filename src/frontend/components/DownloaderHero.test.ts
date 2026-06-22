import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloaderHero from './DownloaderHero.vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('DownloaderHero.vue', () => {
  it('renders correctly with default placeholder', () => {
    const wrapper = mount(DownloaderHero);
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('home.placeholder');
  });

  it('updates input value on type and shows clear button', async () => {
    const wrapper = mount(DownloaderHero);
    
    // Clear button shouldn't exist initially
    expect(wrapper.find('.clear-btn').exists()).toBe(false);

    const input = wrapper.find('input');
    await input.setValue('https://youtube.com/watch?v=123');
    
    expect(wrapper.vm.url).toBe('https://youtube.com/watch?v=123');
    expect(wrapper.find('.clear-btn').exists()).toBe(true);
  });

  it('clears input when clear button is clicked', async () => {
    const wrapper = mount(DownloaderHero);
    const input = wrapper.find('input');
    await input.setValue('https://youtube.com/watch?v=123');
    
    const clearBtn = wrapper.find('.clear-btn');
    await clearBtn.trigger('click');
    
    expect(wrapper.vm.url).toBe('');
    expect(wrapper.find('.clear-btn').exists()).toBe(false);
  });

  it('emits download event when download button is clicked', async () => {
    const wrapper = mount(DownloaderHero);
    const input = wrapper.find('input');
    await input.setValue('https://youtube.com/watch?v=123');
    
    const downloadBtn = wrapper.find('.download-btn');
    await downloadBtn.trigger('click');

    expect(wrapper.emitted('download')).toBeDefined();
    expect(wrapper.emitted('download')?.[0]).toEqual(['https://youtube.com/watch?v=123']);
  });

  it('emits download event when enter is pressed', async () => {
    const wrapper = mount(DownloaderHero);
    const input = wrapper.find('input');
    await input.setValue('https://youtube.com/watch?v=123');
    
    await input.trigger('keyup.enter');

    expect(wrapper.emitted('download')).toBeDefined();
    expect(wrapper.emitted('download')?.[0]).toEqual(['https://youtube.com/watch?v=123']);
  });

  it('does not emit download event if input is empty', async () => {
    const wrapper = mount(DownloaderHero);
    const downloadBtn = wrapper.find('.download-btn');
    await downloadBtn.trigger('click');

    expect(wrapper.emitted('download')).toBeUndefined();
  });
});
