import { DEFAULT_SECONDARY_LANG } from './languages';
import STARTER_MAP from '../data/istockStarterMap.json';
import type { IStockMap, MetadataRecord, Settings } from '../types';

/** Per group: [0] primary key, [1] fallback key. */
export const MAX_GROQ_KEYS_PER_GROUP = 2;
const DEFAULT_SETTINGS: Settings = {
  groq_api_keys_meta: [],
  groq_api_keys_keywords: [],
  everypixels_id: '',
  everypixels_secret: '',
  openrouter_api_key: '',
  target_language: DEFAULT_SECONDARY_LANG,
};
const SETTINGS_KEY = 'stock_metadata_settings';
const ISTOCK_KEY = 'stock_metadata_istock';
const METADATA_KEY = 'stock_metadata_by_file_id';
const VIDEO_FRAME_KEY = 'stock_metadata_video_frame';

function safeParseJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    const start = s.indexOf('{');
    if (start === -1) return fallback;
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(s.slice(start, i + 1)) as T;
          } catch {
            return fallback;
          }
        }
      }
    }
  }
  return fallback;
}

/** Old key shapes, kept only to migrate previously saved settings (single key, then one shared 4-key list). */
interface LegacySettings {
  groq_api_key?: string;
  groq_api_keys?: string[];
}

export function loadSettings(): Settings {
  const s = localStorage.getItem(SETTINGS_KEY);
  if (!s) return { ...DEFAULT_SETTINGS };
  const parsed = safeParseJson<Partial<Settings> & LegacySettings>(s, {});
  const merged: Settings = {
    ...DEFAULT_SETTINGS,
    ...parsed,
    groq_api_keys_meta: parsed.groq_api_keys_meta ?? DEFAULT_SETTINGS.groq_api_keys_meta,
    groq_api_keys_keywords: parsed.groq_api_keys_keywords ?? DEFAULT_SETTINGS.groq_api_keys_keywords,
  };
  // Migrate from the old shared key list: both groups start out with the same keys the user already had.
  if (merged.groq_api_keys_meta.length === 0 && merged.groq_api_keys_keywords.length === 0) {
    const legacyKeys = parsed.groq_api_keys?.length ? parsed.groq_api_keys : (parsed.groq_api_key?.trim() ? [parsed.groq_api_key.trim()] : []);
    if (legacyKeys.length > 0) {
      merged.groq_api_keys_meta = legacyKeys.slice(0, MAX_GROQ_KEYS_PER_GROUP);
      merged.groq_api_keys_keywords = legacyKeys.slice(0, MAX_GROQ_KEYS_PER_GROUP);
    }
  }
  return merged;
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Non-empty, trimmed Groq keys in entry order (for rotation). */
export function getActiveGroqKeys(keys: string[]): string[] {
  return keys.map((k) => (k ?? '').trim()).filter(Boolean);
}

export function loadIStockMap(): IStockMap {
  const saved = localStorage.getItem(ISTOCK_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as IStockMap;
      // Starter map'teki yeni kelimeleri mevcut listeye ekle
      // (kullanıcının özel seçimleri korunur, sadece eksikler eklenir)
      return { ...(STARTER_MAP as IStockMap), ...parsed };
    } catch {
      // fall through to starter map
    }
  }
  return { ...(STARTER_MAP as IStockMap) };
}

export function saveIStockMap(map: IStockMap): void {
  localStorage.setItem(ISTOCK_KEY, JSON.stringify(map));
}

export function loadMetadataByFileId(): Record<string, MetadataRecord> {
  const s = localStorage.getItem(METADATA_KEY);
  return s ? safeParseJson<Record<string, MetadataRecord>>(s, {}) : {};
}

export function saveMetadataByFileId(map: Record<string, MetadataRecord>): void {
  localStorage.setItem(METADATA_KEY, JSON.stringify(map));
}

/** User-picked video analysis/thumbnail frame (seconds), keyed by file id. Absent = auto middle-frame. */
export function loadVideoFrameMap(): Record<string, number> {
  const s = localStorage.getItem(VIDEO_FRAME_KEY);
  return s ? safeParseJson<Record<string, number>>(s, {}) : {};
}

export function saveVideoFrameMap(map: Record<string, number>): void {
  localStorage.setItem(VIDEO_FRAME_KEY, JSON.stringify(map));
}

export function emptyRecord(fileName: string, secondaryLang: string = DEFAULT_SECONDARY_LANG): MetadataRecord {
  return {
    file_name: fileName,
    created_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    secondary_lang: secondaryLang,
    title_en: '', title_secondary: '', description_en: '', description_secondary: '',
    adobe_keywords_en: [], adobe_keywords_secondary: [],
    shutter_keywords_en: [], shutter_keywords_secondary: [],
    istock_keywords_en: [], istock_keywords_secondary: [],
  };
}
