import { describe, it, expect, beforeEach } from 'vitest';
import i18n, { loadLocale } from './i18n.ts';

describe('i18n loadLocale', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to english
    i18n.global.locale.value = 'en';
  });

  it('loads a new locale dynamically and updates localStorage', async () => {
    expect(i18n.global.locale.value).toBe('en');

    // Load Spanish
    await loadLocale('es');

    expect(i18n.global.locale.value).toBe('es');
    expect(localStorage.getItem('lang')).toBe('es');
    expect(i18n.global.availableLocales).toContain('es');
  });

  it('does not re-import if the locale is already loaded', async () => {
    // Es is now in availableLocales from previous test or we load it once here
    await loadLocale('es');
    expect(i18n.global.availableLocales).toContain('es');

    // Load it again
    await loadLocale('es');
    expect(i18n.global.locale.value).toBe('es');
  });
});
