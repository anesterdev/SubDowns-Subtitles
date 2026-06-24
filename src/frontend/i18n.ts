import { createI18n } from 'vue-i18n';
import type { WritableComputedRef } from 'vue';
import en from './locales/en.json' with { type: 'json' };

const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('lang') || 'en' : 'en';

const i18n = createI18n({
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en },
  legacy: false, // Use Composition API
  globalInjection: true,
});

export async function loadLocale(locale: string) {
  if (!(i18n.global.availableLocales as string[]).includes(locale)) {
    const messages = await import(`./locales/${locale}.json`);
    i18n.global.setLocaleMessage(locale, messages.default as unknown as Parameters<typeof i18n.global.setLocaleMessage>[1]);
  }
  (i18n.global.locale as unknown as WritableComputedRef<string>).value = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', locale);
  }
}

export default i18n;
