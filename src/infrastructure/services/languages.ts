/** Supported languages (TRAKL spec v1). */
export interface LanguageMeta {
  /** i18next locale code. */
  code: string;
  /** English name shown in lists. */
  name: string;
  /** Native script label. */
  native: string;
  /** Flag emoji. */
  flag: string;
  /** Right-to-left script. */
  rtl: boolean;
}

// Ordered by how widely spoken the language is worldwide (most-spoken first).
export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', rtl: false },
  { code: 'zh', name: 'Chinese', native: '简体中文', flag: '🇨🇳', rtl: false },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩', rtl: false },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', rtl: false },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩', rtl: false },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', rtl: false },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱', rtl: false },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱', rtl: false },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷', rtl: false },
];

export const LANGUAGE_BY_CODE: Record<string, LanguageMeta> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l]),
);

/** Map a stored profile language NAME to a locale code (legacy persisted data). */
export function nameToCode(name: string): string {
  const match = LANGUAGES.find((l) => l.name === name);
  return match?.code ?? 'en';
}

/** Map a locale code back to its English language name (for profile display sync). */
export function codeToName(code: string): string {
  return LANGUAGE_BY_CODE[code]?.name ?? 'English';
}
