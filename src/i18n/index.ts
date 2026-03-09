import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar/translation.json';
import enUS from './locales/en-US/translation.json';
import esES from './locales/es-ES/translation.json';
import frFR from './locales/fr-FR/translation.json';

export const resources = {
  'en-US': {
    translation: enUS,
  },
  'fr-FR': {
    translation: frFR,
  },
  'es-ES': {
    translation: esES,
  },
  ar: {
    translation: ar,
  },
} as const;

export type SupportedLocale = keyof typeof resources;

const SUPPORTED_LOCALES = Object.keys(resources) as SupportedLocale[];
const FALLBACK_LOCALE: SupportedLocale = 'en-US';

function detectDeviceLocale(): string {
  if (typeof Localization.getLocales === 'function') {
    const firstLocale = Localization.getLocales()[0];
    if (firstLocale?.languageTag) {
      return firstLocale.languageTag;
    }
    if (firstLocale?.languageCode && firstLocale?.regionCode) {
      return `${firstLocale.languageCode}-${firstLocale.regionCode}`;
    }
    if (firstLocale?.languageCode) {
      return firstLocale.languageCode;
    }
  }

  const legacyLocale = (Localization as unknown as { locale?: string }).locale;
  return legacyLocale ?? FALLBACK_LOCALE;
}

function normalizeLocaleTag(locale: string): string {
  return locale.replace(/_/g, '-');
}

export function resolveSupportedLocale(locale: string): SupportedLocale {
  const normalized = normalizeLocaleTag(locale);

  if (SUPPORTED_LOCALES.includes(normalized as SupportedLocale)) {
    return normalized as SupportedLocale;
  }

  const baseLanguage = normalized.split('-')[0]?.toLowerCase();
  const nearestLocale = SUPPORTED_LOCALES.find((candidate) => {
    return candidate.toLowerCase() === baseLanguage || candidate.toLowerCase().startsWith(`${baseLanguage}-`);
  });

  return nearestLocale ?? FALLBACK_LOCALE;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: resolveSupportedLocale(detectDeviceLocale()),
    fallbackLng: FALLBACK_LOCALE,
    supportedLngs: SUPPORTED_LOCALES,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    returnEmptyString: false,
    defaultNS: 'translation',
    ns: ['translation'],
    react: {
      useSuspense: false,
    },
  });
}

export function getSupportedLocales(): SupportedLocale[] {
  return [...SUPPORTED_LOCALES];
}

export default i18n;
