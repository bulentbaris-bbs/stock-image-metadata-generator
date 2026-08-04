/** Shared metadata shape for localStorage. */
export interface MetadataRecord {
  file_name: string;
  created_at: string;
  /** Language code (see lib/languages.ts) the `*_secondary` fields below are written in. */
  secondary_lang: string;
  title_en: string;
  title_secondary: string;
  description_en: string;
  description_secondary: string;
  adobe_keywords_en: string[];
  adobe_keywords_secondary: string[];
  shutter_keywords_en: string[];
  shutter_keywords_secondary: string[];
  istock_keywords_en: string[];
  istock_keywords_secondary: string[];
  /** True while secondary-language fields are being filled in the background after English generation completes. */
  translating?: boolean;
}

export interface FileEntry {
  id: string;
  file: File;
  name: string;
}

export interface Settings {
  /** Up to 4 Groq API keys; rotated automatically when one hits its rate limit. */
  groq_api_keys: string[];
  everypixels_id: string;
  everypixels_secret: string;
  /** Optional fallback used only once every Groq key is rate-limited (routed through openrouter/auto). */
  openrouter_api_key: string;
  /** Secondary output language code (see lib/languages.ts); English is always generated as the base. */
  target_language: string;
}

export type IStockMap = Record<string, string>;

export type KeywordKey =
  | 'adobe_keywords_en'
  | 'adobe_keywords_secondary'
  | 'shutter_keywords_en'
  | 'shutter_keywords_secondary'
  | 'istock_keywords_en'
  | 'istock_keywords_secondary';
