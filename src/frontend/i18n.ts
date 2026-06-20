import { createI18n } from 'vue-i18n';
import en from './locales/en.json' with { type: 'json' };

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
  legacy: false, // Use Composition API
  globalInjection: true,
});

export async function loadLocale(locale: string) {
  if (!i18n.global.availableLocales.includes(locale as any)) {
    const messages = await import(`./locales/${locale}.json`);
    i18n.global.setLocaleMessage(locale as any, messages.default);
  }
  (i18n.global.locale as any).value = locale;
}

export default i18n;
