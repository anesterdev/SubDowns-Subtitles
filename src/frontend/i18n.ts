import { createI18n } from 'vue-i18n';
import type { WritableComputedRef } from 'vue';
import en from './locales/en.json' with { type: 'json' };

const STORAGE_KEY = 'lang';
const FALLBACK_LOCALE = 'en';
const SUPPORTED_LOCALES: ReadonlySet<string> = new Set(['en', 'es', 'ru', 'zh']);

const initialLocale = (() => {
  if (typeof window === 'undefined') return FALLBACK_LOCALE;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && SUPPORTED_LOCALES.has(saved) ? saved : FALLBACK_LOCALE;
})();

const i18n = createI18n({
  locale: initialLocale,
  fallbackLocale: FALLBACK_LOCALE,
  messages: { en },
  legacy: false,
  globalInjection: true,
});

export async function loadLocale(locale: string): Promise<void> {
  if (!SUPPORTED_LOCALES.has(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  if (!(i18n.global.availableLocales as string[]).includes(locale)) {
    const messages = await import(`./locales/${locale}.json`);
    i18n.global.setLocaleMessage(locale, messages.default as unknown as Parameters<typeof i18n.global.setLocaleMessage>[1]);
  }
  (i18n.global.locale as unknown as WritableComputedRef<string>).value = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale);
  }
}

export default i18n;
