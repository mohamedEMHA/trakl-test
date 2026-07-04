import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_BY_CODE, LANGUAGES } from './languages';
import { ar } from './locales/ar';
import { bn } from './locales/bn';
import { de } from './locales/de';
import { el } from './locales/el';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { hi } from './locales/hi';
import { id } from './locales/id';
import { it } from './locales/it';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { nl } from './locales/nl';
import { pl } from './locales/pl';
import { pt } from './locales/pt';
import { ru } from './locales/ru';
import { tr } from './locales/tr';
import { ur } from './locales/ur';
import { vi } from './locales/vi';
import { zh } from './locales/zh';

const STORAGE_KEY = 'trakl-language-v1';

export const resources = {
  en: { translation: en },
  el: { translation: el },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  zh: { translation: zh },
  ar: { translation: ar },
  hi: { translation: hi },
  pt: { translation: pt },
  ja: { translation: ja },
  ru: { translation: ru },
  id: { translation: id },
  tr: { translation: tr },
  it: { translation: it },
  ko: { translation: ko },
  vi: { translation: vi },
  pl: { translation: pl },
  nl: { translation: nl },
  bn: { translation: bn },
  ur: { translation: ur },
} as const;

const SUPPORTED = LANGUAGES.map((l) => l.code);

/** Pick the best initial language: stored choice → device locale → English. */
async function resolveInitialLanguage(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    // ignore read errors, fall through to device locale
  }
  const device = Localization.getLocales()[0]?.languageCode ?? 'en';
  return SUPPORTED.includes(device) ? device : 'en';
}

/** Apply RTL/LTR layout direction for the active language. */
export function applyDirection(code: string) {
  const isRTL = LANGUAGE_BY_CODE[code]?.rtl ?? false;
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // A full reload is required for the direction flip to take visual effect
    // on native; on web it applies immediately.
  }
}

let initialized = false;

export async function initI18n() {
  if (initialized) return i18n;
  initialized = true;

  const lng = await resolveInitialLanguage();
  applyDirection(lng);

  // oxlint-disable-next-line import/no-named-as-default-member
  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    interpolation: { escapeValue: false },
    returnNull: false,
  });

  return i18n;
}

/** Change the active language, persist it, and apply layout direction. */
export async function changeLanguage(code: string) {
  if (!SUPPORTED.includes(code)) return;
  // oxlint-disable-next-line import/no-named-as-default-member
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // non-fatal: persistence failure shouldn't block the switch
  }
  applyDirection(code);
}

export default i18n;
