/** Everypixel Image Keywording API. May be blocked by CORS in browser; use from backend proxy if needed. */
import { translate, type UILang } from '../lib/i18n';

export interface EverypixelKeyword {
  keyword: string;
  score: number;
}

export interface EverypixelColor {
  name: string;
  rgb: [number, number, number];
  hex: string;
  percentage: number;
}

export interface EverypixelKeywordsResult {
  keywords: EverypixelKeyword[];
  colors?: EverypixelColor[];
}

export interface EverypixelOptions {
  num_keywords?: number;
  threshold?: number;
  colors?: boolean;
  num_colors?: number;
  lang?: string;
}

const DEFAULT_OPTIONS: EverypixelOptions = {
  num_keywords: 50,
  // 0.3 trades a little recall for precision — 0.2 let through enough low-confidence tags to be noticeable.
  threshold: 0.3,
  // We never read `colors` from the result — skip requesting it to save payload/latency.
  colors: false,
  lang: 'en',
};

/** Strip stray control/markup characters and collapse whitespace — Everypixel's vocabulary is normally clean, but defend against odd payloads anyway. */
function sanitizeKeyword(raw: string): string {
  return raw
    .replace(/[<>{}[\]\\|`^~_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function everypixelErrorMessage(status: number, body: string, uiLang: UILang): string {
  if (status === 401) return translate('everypixel_invalid_key', uiLang);
  if (status === 429) return translate('everypixel_quota', uiLang);
  if (status === 502) return translate('everypixel_busy', uiLang);
  return `Everypixel: ${status} ${body.slice(0, 150)}`;
}

export async function apiEverypixels(
  file: File,
  clientId: string,
  clientSecret: string,
  options: EverypixelOptions = {},
  uiLang: UILang = 'tr'
): Promise<EverypixelKeywordsResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const params = new URLSearchParams();
  if (opts.num_keywords != null) params.set('num_keywords', String(opts.num_keywords));
  if (opts.threshold != null) params.set('threshold', String(opts.threshold));
  if (opts.colors != null) params.set('colors', String(opts.colors));
  if (opts.num_colors != null) params.set('num_colors', String(opts.num_colors));
  if (opts.lang != null) params.set('lang', opts.lang);

  const url = `https://api.everypixel.com/v1/keywords?${params.toString()}`;
  const form = new FormData();
  form.append('data', file, file.name);

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: form,
    });
  } catch {
    throw new Error(translate('everypixel_cors', uiLang));
  }

  const text = await res.text();
  if (!res.ok) {
    throw new Error(everypixelErrorMessage(res.status, text, uiLang));
  }

  let data: { keywords?: Array<{ keyword?: string; score?: number }>; colors?: Array<{ name?: string; rgb?: number[]; hex?: string; percentage?: number }>; status?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(translate('everypixel_invalid_response', uiLang));
  }

  const seen = new Set<string>();
  const keywords: EverypixelKeyword[] = (data?.keywords ?? [])
    .map((k) => ({ keyword: sanitizeKeyword(k.keyword ?? ''), score: typeof k.score === 'number' ? k.score : 0 }))
    .filter((k) => {
      if (!k.keyword) return false;
      const lower = k.keyword.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    // The API documents descending score order, but we sort explicitly rather than trust that — the app
    // relies on this order to place the highest-relevance terms first across all three platforms.
    .sort((a, b) => b.score - a.score);

  const colors: EverypixelColor[] | undefined = data?.colors?.length
    ? (data.colors ?? []).map((c) => ({
        name: c.name ?? '',
        rgb: Array.isArray(c.rgb) && c.rgb.length >= 3 ? [c.rgb[0], c.rgb[1], c.rgb[2]] as [number, number, number] : [0, 0, 0],
        hex: c.hex ?? '',
        percentage: typeof c.percentage === 'number' ? c.percentage : 0,
      }))
    : undefined;

  return { keywords, colors };
}

/** Keyword strings already sorted by score (highest first) and deduped/sanitized in apiEverypixels. */
export function everypixelToKeywordStrings(result: EverypixelKeywordsResult): string[] {
  return result.keywords.map((k) => k.keyword.trim()).filter(Boolean);
}
