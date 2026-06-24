import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import DownloaderHero from './DownloaderHero.vue';
import { BTN_THROTTLE } from '../constants/downloader.ts';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const mountHero = (props: { disabled?: boolean } = {}) =>
  mount(DownloaderHero, { props });

describe('DownloaderHero.vue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('renders input with i18n placeholder and aria-label, button enabled by default', () => {
    const wrapper = mountHero();
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('home.placeholder');
    expect(input.attributes('aria-label')).toBe('home.aria_video_link');
    expect(wrapper.find('.download-btn').attributes('disabled')).toBeUndefined();
  });

  it('binds input to url ref via v-model and reveals clear button', async () => {
    const wrapper = mountHero();
    expect(wrapper.vm.url).toBe('');
    expect(wrapper.find('.clear-btn').exists()).toBe(false);
    await wrapper.find('input').setValue('https://youtube.com/watch?v=123');
    expect(wrapper.vm.url).toBe('https://youtube.com/watch?v=123');
    expect(wrapper.find('.clear-btn').exists()).toBe(true);
  });

  it('clears url ref via clear button and hides it', async () => {
    const wrapper = mountHero();
    await wrapper.find('input').setValue('https://youtube.com/watch?v=123');
    await wrapper.find('.clear-btn').trigger('click');
    expect(wrapper.vm.url).toBe('');
    expect(wrapper.find('.clear-btn').exists()).toBe(false);
  });

  it('emits trimmed url on download click', async () => {
    const wrapper = mountHero();
    await wrapper.find('input').setValue('  https://youtube.com/watch?v=123  ');
    await wrapper.find('.download-btn').trigger('click');
    expect(wrapper.emitted('download')).toEqual([['https://youtube.com/watch?v=123']]);
  });

  it('emits trimmed url on Enter key', async () => {
    const wrapper = mountHero();
    const input = wrapper.find('input');
    await input.setValue(' https://youtube.com/watch?v=123 ');
    await input.trigger('keyup.enter');
    expect(wrapper.emitted('download')).toEqual([['https://youtube.com/watch?v=123']]);
  });

  it('does not emit or lock when url is empty or whitespace', async () => {
    const wrapper = mountHero();
    const btn = wrapper.find('.download-btn');
    await wrapper.find('input').setValue('   ');
    await btn.trigger('click');
    expect(wrapper.emitted('download')).toBeUndefined();
    expect(btn.attributes('disabled')).toBeUndefined();
  });

  it('keeps button disabled 10ms before the throttle window elapses', async () => {
    const wrapper = mountHero();
    await wrapper.find('input').setValue('https://youtube.com/watch?v=123');
    const btn = wrapper.find('.download-btn');

    await btn.trigger('click');
    expect(wrapper.emitted('download')?.length).toBe(1);

    await vi.advanceTimersByTimeAsync(BTN_THROTTLE - 10);
    expect(btn.attributes('disabled')).toBeDefined();

    await btn.trigger('click');
    expect(wrapper.emitted('download')?.length).toBe(1);
  });

  it('re-enables button and accepts a new click 10ms after the throttle window elapses', async () => {
    const wrapper = mountHero();
    await wrapper.find('input').setValue('https://youtube.com/watch?v=123');
    const btn = wrapper.find('.download-btn');

    await btn.trigger('click');
    expect(wrapper.emitted('download')?.length).toBe(1);

    await vi.advanceTimersByTimeAsync(BTN_THROTTLE + 10);
    expect(btn.attributes('disabled')).toBeUndefined();

    await btn.trigger('click');
    expect(wrapper.emitted('download')?.length).toBe(2);
  });

  it('blocks click and Enter when disabled prop is true', async () => {
    const wrapper = mountHero({ disabled: true });
    await wrapper.find('input').setValue('https://youtube.com/watch?v=123');
    const btn = wrapper.find('.download-btn');

    expect(btn.attributes('disabled')).toBeDefined();

    await btn.trigger('click');
    await wrapper.find('input').trigger('keyup.enter');
    expect(wrapper.emitted('download')).toBeUndefined();

    await vi.advanceTimersByTimeAsync(500);
    expect(btn.attributes('disabled')).toBeDefined();
  });

});
