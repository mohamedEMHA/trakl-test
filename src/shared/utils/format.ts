/**
 * Locale-aware formatting for TRAKL.
 *
 * Amounts in the data model are EUR-denominated, so currency formatting keeps
 * EUR as the currency but localizes digit grouping and symbol placement per the
 * active language. Numbers and dates follow the active locale too.
 *
 * These are plain functions that take a locale string (use `i18n.language`),
 * plus thin hooks that read the active language from react-i18next.
 */

import { useTranslation } from 'react-i18next';

/** App language code → BCP-47 locale used by Intl. */
const LOCALE_BY_LANG: Record<string, string> = {
  en: 'en-GB',
  el: 'el-GR',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  zh: 'zh-CN',
  ar: 'ar-EG',
  hi: 'hi-IN',
  pt: 'pt-BR',
  ja: 'ja-JP',
  ru: 'ru-RU',
  id: 'id-ID',
  tr: 'tr-TR',
  it: 'it-IT',
  ko: 'ko-KR',
  vi: 'vi-VN',
  pl: 'pl-PL',
  nl: 'nl-NL',
  bn: 'bn-BD',
  ur: 'ur-PK',
};

const CURRENCY = 'EUR';

function resolveLocale(lang: string): string {
  return LOCALE_BY_LANG[lang] ?? LOCALE_BY_LANG.en;
}

/** Format an EUR amount, e.g. "€2,840" (rounded) or "€12.50" (with cents). */
export function formatCurrency(amount: number, lang: string, opts?: { cents?: boolean }): string {
  const locale = resolveLocale(lang);
  const fractionDigits = opts?.cents ? 2 : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: CURRENCY,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `€${amount.toFixed(fractionDigits)}`;
  }
}

/** Format a plain number with locale digit grouping, e.g. "1,240". */
export function formatNumber(value: number, lang: string): string {
  const locale = resolveLocale(lang);
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return `${value}`;
  }
}

/** Format a date with Intl options under the active locale. */
export function formatDate(
  date: Date | string,
  lang: string,
  options: Intl.DateTimeFormatOptions,
): string {
  const locale = resolveLocale(lang);
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return d.toLocaleDateString(undefined, options);
  }
}

/** Format a time under the active locale (hour + minute). */
export function formatTime(date: Date | string, lang: string): string {
  return formatDate(date, lang, { hour: 'numeric', minute: '2-digit' });
}

export type Formatters = {
  /** Active app language code. */
  lang: string;
  /** Resolved BCP-47 locale. */
  locale: string;
  currency: (amount: number, opts?: { cents?: boolean }) => string;
  number: (value: number) => string;
  date: (date: Date | string, options: Intl.DateTimeFormatOptions) => string;
  time: (date: Date | string) => string;
};

/** Hook returning locale-bound formatters for the active language. */
export function useFormatters(): Formatters {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  return {
    lang,
    locale: resolveLocale(lang),
    currency: (amount, opts) => formatCurrency(amount, lang, opts),
    number: (value) => formatNumber(value, lang),
    date: (date, options) => formatDate(date, lang, options),
    time: (date) => formatTime(date, lang),
  };
}
