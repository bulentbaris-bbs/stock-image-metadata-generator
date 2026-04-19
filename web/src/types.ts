/** Shared metadata shape for CSV and localStorage (see App.tsx). */
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

export const CSV_HEADERS = [
  'file_path',
  'file_name',
  'created_at',
  'title_en',
  'title_tr',
  'description_en',
  'description_tr',
  'adobe_keywords_en',
  'adobe_keywords_tr',
  'shutter_keywords_en',
  'shutter_keywords_tr',
  'istock_keywords_en',
  'istock_keywords_tr',
] as const;

export type CsvColumn = (typeof CSV_HEADERS)[number];
