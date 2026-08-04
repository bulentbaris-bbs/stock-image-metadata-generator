export interface SecondaryLanguage {
  code: string;
  /** English name, used inside AI prompts. */
  name: string;
  /** Native-script label shown in the UI. */
  native: string;
}

/** Ordered by stock-contributor volume on Adobe Stock / Shutterstock / iStock. */
export const SECONDARY_LANGUAGES: SecondaryLanguage[] = [
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'zh', name: 'Chinese (Simplified)', native: '中文' },
];

export const DEFAULT_SECONDARY_LANG = 'tr';

export function getLanguage(code: string | undefined): SecondaryLanguage {
  return SECONDARY_LANGUAGES.find((l) => l.code === code) ?? SECONDARY_LANGUAGES[0];
}
