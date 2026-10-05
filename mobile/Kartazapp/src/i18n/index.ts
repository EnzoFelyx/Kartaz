import { getLocales } from 'expo-localization';
// `use` renomeado: o nome original é confundido com um hook do React pelo lint.
import i18n, { use as registerI18nPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FALLBACK_LANGUAGE: AppLanguage = 'en';

/** Tag BCP 47 usada para formatar datas e números em cada idioma. */
const LOCALE_TAGS: Record<AppLanguage, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
};

function isSupported(code: string | null | undefined): code is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(code as AppLanguage);
}

/** Primeiro idioma do aparelho que o app suporta; senão, inglês. */
function detectDeviceLanguage(): AppLanguage {
  const match = getLocales().find((locale) => isSupported(locale.languageCode));
  return isSupported(match?.languageCode) ? match.languageCode : FALLBACK_LANGUAGE;
}

registerI18nPlugin(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: {
    // React Native não precisa de escape de HTML.
    escapeValue: false,
  },
});

/** Locale (ex.: pt-BR) do idioma atual, para `toLocaleString` / `toLocaleDateString`. */
export function getLocaleTag() {
  const language = i18n.language;
  return isSupported(language) ? LOCALE_TAGS[language] : LOCALE_TAGS[FALLBACK_LANGUAGE];
}

export default i18n;
