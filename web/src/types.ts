/** Shared metadata shape for localStorage. */
export interface MetadataRecord {
  file_name: string;
  created_at: string;
  title_en: string;
  title_tr: string;
  description_en: string;
  description_tr: string;
  adobe_keywords_en: string[];
  adobe_keywords_tr: string[];
  shutter_keywords_en: string[];
  shutter_keywords_tr: string[];
  istock_keywords_en: string[];
  istock_keywords_tr: string[];
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
  /** Optional free-tier fallback used only once every Groq key is rate-limited. */
  gemini_api_key: string;
}

export type IStockMap = Record<string, string>;

export type KeywordKey =
  | 'adobe_keywords_en'
  | 'adobe_keywords_tr'
  | 'shutter_keywords_en'
  | 'shutter_keywords_tr'
  | 'istock_keywords_en'
  | 'istock_keywords_tr';
