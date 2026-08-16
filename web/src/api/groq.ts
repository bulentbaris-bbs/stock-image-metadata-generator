import { openRouterText, openRouterVision } from './openrouter';
import { translate, type UILang } from '../lib/i18n';
import { KeyPool } from '../lib/keyPool';
import type { SecondaryLanguage } from '../lib/languages';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_VISION_MODEL = 'qwen/qwen3.6-27b';
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_REQUEST_MS = 90000;

export interface AiCreds {
  groqKeys: string[];
  openRouterKey?: string;
  lang?: UILang;
}

export interface GroqOnlyCreds {
  groqKeys: string[];
  lang?: UILang;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let visionQueue: Promise<unknown> = Promise.resolve();
function enqueueVision<T>(task: () => Promise<T>): Promise<T> {
  const run = visionQueue.then(() => task());
  visionQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function withOpenRouterFallback<T>(
  creds: AiCreds | GroqOnlyCreds,
  groqCall: (keys: string[]) => Promise<T>,
  openRouterCall: (openRouterKey: string) => Promise<T>,
): Promise<T> {
  const groqKeys = creds.groqKeys.filter(Boolean);
  const isGroqOnly = !('openRouterKey' in creds);
  const openRouterKey = isGroqOnly ? undefined : (creds as AiCreds).openRouterKey?.trim();
  const lang = creds.lang ?? 'tr';
  if (groqKeys.length > 0) {
    try {
      return await groqCall(groqKeys);
    } catch (e) {
      if (!openRouterKey) {
        if (isGroqOnly) throw new Error(translate('err_groq_only_rate_limited', lang));
        throw e;
      }
      try {
        return await openRouterCall(openRouterKey);
      } catch {
        throw e;
      }
    }
  }
  if (openRouterKey) return openRouterCall(openRouterKey);
  throw new Error(translate('err_groq_key_missing', lang));
}

function parseResetSeconds(header: string | null): number | null {
  if (!header) return null;
  const m = /([\d.]+)s/.exec(header);
  return m ? Math.ceil(parseFloat(m[1]) * 1000) : null;
}

async function groqChat(body: Record<string, unknown>, keys: string[], label: string, lang: UILang): Promise<string> {
  const pool = new KeyPool(keys);
  const maxAttempts = pool.size * 2 + 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const key = pool.next();
    if (!key) {
      const waitMs = Math.max(1000, Math.min(pool.earliestAvailableAt() - Date.now(), 60000));
      await sleep(waitMs);
      continue;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), GROQ_REQUEST_MS);
    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error(translate('err_request_timeout', lang, { label }));
      }
      throw new Error(translate('err_connection_failed', lang, { label }));
    }
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      const content = (msg?.content ?? '').trim();
      if (content) return content;
      const reasoning = (msg?.reasoning ?? msg?.reasoning_content ?? '').trim();
      if (reasoning) return reasoning;
      return '';
    }

    const text = await res.text();

    if (res.status === 401 || res.status === 403) {
      throw new Error(translate('err_api_key_invalid', lang, { label }));
    }

    if (res.status === 429 || res.status === 503) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const resetTokens = parseResetSeconds(res.headers.get('x-ratelimit-reset-tokens'));
      const resetRequests = parseResetSeconds(res.headers.get('x-ratelimit-reset-requests'));
      let cooldownMs = 20000;
      if (Number.isFinite(retryAfter) && retryAfter > 0) cooldownMs = retryAfter * 1000;
      else if (resetTokens || resetRequests) cooldownMs = Math.max(resetTokens ?? 0, resetRequests ?? 0);
      pool.markCooldown(key, Math.max(cooldownMs, 1000));
      continue;
    }

    throw new Error(translate('err_server_error', lang, { label, status: res.status, text: text.slice(0, 150) }));
  }
  throw new Error(translate('err_rate_limited', lang, { label }));
}

export async function groqVision(
  b64: string,
  prompt: string,
  creds: AiCreds | GroqOnlyCreds,
  maxTokens = 800
): Promise<string> {
  const lang = creds.lang ?? 'tr';
  return enqueueVision(() =>
    withOpenRouterFallback(
      creds,
      (keys) =>
        groqChat(
          {
            model: GROQ_VISION_MODEL,
            temperature: 0.4,
            messages: [
              { role: 'system', content: '/no_think' },
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
                  { type: 'text', text: prompt },
                ],
              },
            ],
            max_tokens: maxTokens,
          },
          keys,
          'Groq vision',
          lang
        ),
      (openRouterKey) => openRouterVision(b64, prompt, openRouterKey, maxTokens, lang)
    )
  );
}

export async function groqText(
  prompt: string,
  creds: AiCreds | GroqOnlyCreds,
  maxTokens = 500,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const body: Record<string, unknown> = {
    model: GROQ_TEXT_MODEL,
    temperature: options?.jsonMode ? 0.2 : 1,
    messages: [
      { role: 'system', content: '/no_think' },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
  };
  if (options?.jsonMode) {
    body.response_format = { type: 'json_object' };
  }
  const lang = creds.lang ?? 'tr';
  return withOpenRouterFallback(
    creds,
    (keys) => groqChat(body, keys, 'Groq text', lang),
    (openRouterKey) => openRouterText(prompt, openRouterKey, maxTokens, lang)
  );
}

// ============================================================================
// MODÜL 1: SADECE BAŞLIK VE AÇIKLAMA (GROQ API 1)
// ============================================================================

function buildMetadataInstructions(lang: SecondaryLanguage): string {
  return `You are a professional stock photo metadata expert. Analyze this image for Adobe Stock, Shutterstock, iStock.

Consider: current market trends, buyer search behavior, commercial appeal, and SEO best practices.
Focus on what buyers actually search for on Adobe Stock, Shutterstock, and iStock.

Output format (critical): Return ONLY valid JSON with ALL four keys as non-empty strings. Never omit a field. Never use null or empty strings.
{"title_en":"...","title_secondary":"...","description_en":"...","description_secondary":"..."}
(title_secondary and description_secondary must be written in ${lang.name}.)

Title (title_en / title_secondary) — what is visible (agency-style, buyer-facing):
- State clearly what the image is about: main subject, action, and setting. Use "Who, What, Where, When" where helpful (one or two complete sentences if needed).
- Target length (both title_en and title_secondary): **Aim for ~150 characters** (including spaces) as the ideal; keep roughly **130–180**; **hard maximum 200**. When the scene supports it, do **not** stop under **~120** with a thin one-liner—add subject, action, setting, and concrete anchors (gear, place type, shot feel) until you approach the target.
- Strong anchors (use when relevant to the image): region/country or named place if clearly inferable; environment (underwater, factory floor, etc.); shot feel (e.g. POV, wide shot, underwater shot) if it matches the frame; visible gear or role (hard hat, freediving, etc.).
- For faceless or abstract commercial scenes, prefer phrasing like "unrecognizable …" when appropriate and name the theme (e.g. occupational health and safety concept, corporate wellness concept).
- Avoid weak bare patterns like "Man doing X" or "X in Y" with no extra detail when the image supports richer wording.
- Natural prose only; do NOT stack comma-separated keywords or tags. Readable sentences beat keyword lists.
- Tone (critical) for titles: Direct, declarative stock headlines—no hedging anywhere in title_en or title_secondary in either language (e.g. no probably, possibly, maybe, likely, seems, appears, might, could, perhaps, or their ${lang.name} equivalents). Do not use inferential bridges such as "given the presence of," "suggesting that," or "which implies"—state what is visible (e.g. hard hat on desk, office, professional attire) as concrete facts, not as guesses.
- Avoid vague closing clichés in titles (e.g. "sense of productivity," "spirit of collaboration")—prefer specific visible anchors instead.
- Both title_en and title_secondary must convey the same meaning.

Description (description_en / description_secondary) — complementary detail ONLY (REQUIRED, never empty):
- The title summarizes the scene; descriptions MUST add different information focused on topic and content, not generic production talk. Prioritize: what is happening (actions, sequence), who or what is involved (roles, objects, equipment, symbols), relationships between elements, setting and context (place type, industry, activity), and the narrative or theme the image communicates. Pick at least two concrete content angles the title does not already state.
- Do NOT center the description on lighting, mood, atmosphere, color palette, or composition unless one short phrase supports the subject (e.g. clinical lighting for a medical scene). Avoid filler about "warm tones" or "wide shot" when the image calls for subject detail instead.
- You may briefly mention typical buyer contexts (e.g. campaigns, editorial) only as a closing clause if space allows—not as the main substance.
- Tone (critical): Write in direct, declarative stock-copy style—state what the image shows. Do NOT use hedging or vague uncertainty in either language (e.g. probably, possibly, maybe, likely, seems, appears, might, could, perhaps, or their ${lang.name} equivalents). If a specific label is not visible, use concrete but general wording (e.g. coastal road, industrial interior) instead of guessing with qualifiers.
- Never open descriptions with hedging or speculation (e.g. not "Probably…", "Likely…", "It appears…"); use present-tense, affirmative sentences that read as factual stock copy about what is in the frame.
- Do not use hedging or inferential phrasing anywhere in the description body (not only the first words): avoid "likely," "given the presence of," "suggesting," "appears to be," "seems to," "may be working in." If props imply an industry, name the visible objects/setting directly.
- Avoid weak abstract closers such as "convey a sense of industry and productivity" or "sense of collaboration"—replace with concrete visible detail or buyer use the image actually supports.
- Length: 220–350 characters each (minimum 200, hard maximum 400). Write at least 2–3 full sentences covering different content angles. description_secondary must be written in ${lang.name}; description_en in English.
- Do NOT paste or lightly rephrase the title. No duplicate sentences from the title.`;
}

export function buildMetadataVisionPrompt(hint: string, lang: SecondaryLanguage): string {
  const instructions = buildMetadataInstructions(lang);
  const t = hint.trim();
  if (!t) return instructions;

  return `YOU MUST PRIORITIZE THE USER'S NOTE BELOW AS THE ABSOLUTE SOURCE OF TRUTH AND PROTAGONIST OF THE SCENE.

USER NOTE (MANDATORY CONTENT TO REFLECT):
"${t}"

CRITICAL INTEGRATION RULES FOR USER NOTE:
1. You MUST incorporate the specific actions, subjects, and specific props/equipment directly into BOTH title_en/title_secondary and description_en/description_secondary.
2. The user note defines the MAIN PROTAGONIST and the PRIMARY ACTION. The visual details in the image provide only the setting/environment context. Do NOT write generic background descriptions without anchoring them directly around the subject and action mentioned in the note.
3. If the user note mentions background subjects or specific secondary actions, you MUST explicitly describe their presence in the description text as well.
4. If there is any slight ambiguity between visual analysis and the user note, the user note takes strict precedence. Integrate the meaning naturally—do not ignore any detail from the note.

---

${instructions}`;
}

function normalizeModelJsonRaw(raw: string): string {
  let s = (raw ?? '').trim();
  if (!s) return '';
  const thinkClose = '<' + '/think>';
  const thinkOpen = '<' + 'think>';
  const closeIdx = s.lastIndexOf(thinkClose);
  if (closeIdx !== -1) s = s.slice(closeIdx + thinkClose.length).trim();
  if (s.startsWith(thinkOpen)) {
    const endOpen = s.indexOf(thinkClose);
    if (endOpen !== -1) s = s.slice(endOpen + thinkClose.length).trim();
    else s = s.slice(thinkOpen.length).trim();
  }
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) s = fence[1].trim();
  return s;
}

function extractFirstJsonObject(raw: string): string {
  const normalized = normalizeModelJsonRaw(raw);
  const start = normalized.indexOf('{');
  if (start === -1) return '';
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < normalized.length; i++) {
    const c = normalized[i];
    if (inString) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return normalized.slice(start, i + 1);
    }
  }
  return '';
}

const HEDGE_EN_RE =
  /\b(likely|probably|possibly|maybe|perhaps)\b|\bappear(s)?\s+to(\s+be)?\b|\bseem(s)?\s+to(\s+be)?\b|\bit\s+appears\b|\b(might|could)\s+be\b|\bgiven\s+the\s+presence\b|\bsuggest(s|ing)?\s+that\b/i;
const HEDGE_TR_RE =
  /muhtemelen|belki|sanırım|olabilir|büyük\s+ihtimalle|gibi\s+görünüyor|muhtemel\s+olarak|görünüşe\s+göre/i;

function textNeedsHedgeFix(s: string, langCode: string): boolean {
  const t = (s ?? '').trim();
  if (!t) return false;
  if (HEDGE_EN_RE.test(t)) return true;
  if (langCode === 'tr' && HEDGE_TR_RE.test(t)) return true;
  return false;
}

async function runHedgeRefinePass(
  creds: AiCreds,
  title_en: string,
  title_secondary: string,
  description_en: string,
  description_secondary: string,
  lang: SecondaryLanguage,
): Promise<{ title_en: string; title_secondary: string; description_en: string; description_secondary: string } | null> {
  const secondaryBan =
    lang.code === 'tr'
      ? 'Banned in the secondary-language fields (title_secondary, description_secondary): muhtemelen, belki, sanırım, olabilir, büyük ihtimalle, gibi görünüyor, görünüşe göre, muhtemel olarak.'
      : `Banned in the secondary-language fields (title_secondary, description_secondary): the ${lang.name} equivalents of likely, probably, possibly, maybe, perhaps, appears to, seems to, might be, could be.`;
  const p = `You are an editor for microstock metadata. Rewrite ALL four fields below to remove EVERY trace of hedging or uncertainty while keeping the same factual scene.

Banned in English fields (title_en, description_en): likely, probably, possibly, maybe, perhaps, appear/appears to (be), seem/seems to (be), it appears, might be, could be, given the presence, suggesting that.
${secondaryBan}

Use direct present-tense statements only. Do not add new subjects or guesses. Titles: **do not shorten** to strip hedging—replace with concrete wording and keep length in the **~150–175** band (min 130, max 200); if a title was long, the revised title should stay similarly substantial unless it was overlong. Descriptions: 220–350 characters each (minimum 200, hard maximum 400). Keep title_secondary and description_secondary in ${lang.name}.

Return ONLY valid JSON:
{"title_en":"","title_secondary":"","description_en":"","description_secondary":""}

title_en: ${JSON.stringify(title_en)}
title_secondary: ${JSON.stringify(title_secondary)}
description_en: ${JSON.stringify(description_en)}
description_secondary: ${JSON.stringify(description_secondary)}`;
  try {
    const raw = await groqText(p, creds, 900);
    const jsonStr = extractFirstJsonObject(raw);
    if (!jsonStr) return null;
    const o = JSON.parse(jsonStr) as Record<string, string>;
    const clip = (s: unknown, max: number) =>
      typeof s === 'string' ? (s.length > max ? s.slice(0, max) : s) : '';
    const te = clip(o.title_en, 200);
    const ts = clip(o.title_secondary, 200);
    const de = clip(o.description_en, 2000);
    const ds = clip(o.description_secondary, 2000);
    if (!te.trim() || !de.trim() || !ts.trim() || !ds.trim()) return null;
    return { title_en: te, title_secondary: ts, description_en: de, description_secondary: ds };
  } catch {
    return null;
  }
}

async function refineMetadataAgainstHedging(
  creds: AiCreds,
  title_en: string,
  title_secondary: string,
  description_en: string,
  description_secondary: string,
  lang: SecondaryLanguage,
): Promise<{ title_en: string; title_secondary: string; description_en: string; description_secondary: string }> {
  let tEn = title_en;
  let tSec = title_secondary;
  let dEn = description_en;
  let dSec = description_secondary;
  for (let i = 0; i < 2; i++) {
    if (
      !textNeedsHedgeFix(tEn, lang.code) &&
      !textNeedsHedgeFix(tSec, lang.code) &&
      !textNeedsHedgeFix(dEn, lang.code) &&
      !textNeedsHedgeFix(dSec, lang.code)
    ) {
      break;
    }
    const next = await runHedgeRefinePass(creds, tEn, tSec, dEn, dSec, lang);
    if (!next) break;
    tEn = next.title_en;
    tSec = next.title_secondary;
    dEn = next.description_en;
    dSec = next.description_secondary;
  }
  return { title_en: tEn, title_secondary: tSec, description_en: dEn, description_secondary: dSec };
}

async function fillDescriptionsFromTitles(
  creds: AiCreds,
  titleEn: string,
  titleSecondary: string,
  hint: string,
  lang: SecondaryLanguage,
): Promise<{ description_en: string; description_secondary: string } | null> {
  const ref = hint.trim()
    ? `\nUser note (high priority; paraphrase into descriptions, do not ignore): ${JSON.stringify(hint.trim())}`
    : '';
  const p = `You are a microstock copywriter. Titles are fixed below. Write ONLY complementary image descriptions in English and ${lang.name}.

Rules:
- Do NOT repeat or copy the title wording. Expand on topic and content: actions, objects, equipment, relationships, setting/context, and the theme or story.
- Use direct, declarative wording—no hedging.
- Each description 220–350 characters (minimum 200, hard maximum 400). Write at least 2–3 full sentences. description_en in English, description_secondary in ${lang.name}.
- Return ONLY valid JSON: {"description_en":"...","description_secondary":"..."}

title_en: ${titleEn}
title_secondary: ${titleSecondary}${ref}`;
  try {
    const raw = await groqText(p, creds, 550);
    const jsonStr = extractFirstJsonObject(raw);
    if (!jsonStr) return null;
    const o = JSON.parse(jsonStr) as Record<string, string>;
    const clip = (s: unknown, max: number) =>
      typeof s === 'string' ? (s.length > max ? s.slice(0, max) : s) : '';
    const en = clip(o.description_en, 2000);
    const sec = clip(o.description_secondary, 2000);
    if (!en.trim() || !sec.trim()) return null;
    return { description_en: en, description_secondary: sec };
  } catch {
    return null;
  }
}

async function repairMetadataJsonWithText(creds: AiCreds, raw: string): Promise<string> {
  const snippet = normalizeModelJsonRaw(raw).slice(0, 6000);
  const p = `Convert the following stock-photo metadata draft into valid JSON with exactly these keys: title_en, title_secondary, description_en, description_secondary. All string values must be non-empty. Preserve meaning; fix formatting only.

Draft:
${snippet}`;
  const repaired = await groqText(p, creds, 1400, { jsonMode: true });
  return extractFirstJsonObject(repaired);
}

async function finalizeMetadataRecord(
  creds: AiCreds,
  hint: string,
  o: Record<string, unknown>,
  lang: SecondaryLanguage
): Promise<{ title_en: string; title_secondary: string; description_en: string; description_secondary: string }> {
  const clip = (s: unknown, max: number) =>
    typeof s === 'string' ? (s.length > max ? s.slice(0, max) : s) : '';
  const title_en = clip(o.title_en, 200);
  const title_secondary = clip(o.title_secondary, 200);
  let description_en = clip(o.description_en, 2000);
  let description_secondary = clip(o.description_secondary, 2000);
  if (!description_en.trim() || !description_secondary.trim()) {
    const filled = await fillDescriptionsFromTitles(creds, title_en, title_secondary, hint, lang);
    if (filled) {
      description_en = filled.description_en;
      description_secondary = filled.description_secondary;
    }
  }
  const refined = await refineMetadataAgainstHedging(creds, title_en, title_secondary, description_en, description_secondary, lang);
  return refined;
}

/** Sadece Başlık ve Açıklama Üretimi (Groq API 1) */
export async function apiMetadata(
  b64: string,
  creds: AiCreds,
  hint: string,
  lang: SecondaryLanguage
): Promise<{ title_en: string; title_secondary: string; description_en: string; description_secondary: string }> {
  const prompt = buildMetadataVisionPrompt(hint, lang);
  const jsonRetrySuffix =
    '\n\nCRITICAL: Your entire reply must be ONE JSON object only, starting with { and ending with }. Keys: title_en, title_secondary, description_en, description_secondary. No markdown, no thinking tags, no other text.';
  const raw = await groqVision(b64, prompt + jsonRetrySuffix, creds, 2048);
  let jsonStr = extractFirstJsonObject(raw);
  if (!jsonStr && raw.trim()) {
    jsonStr = await repairMetadataJsonWithText(creds, raw);
  }
  if (!jsonStr) {
    const preview = normalizeModelJsonRaw(raw).slice(0, 120);
    throw new Error(translate('err_json_not_found', creds.lang ?? 'tr', { preview: preview ? ` (${preview}…)` : '' }));
  }
  try {
    const o = JSON.parse(jsonStr) as Record<string, unknown>;
    return finalizeMetadataRecord(creds, hint, o, lang);
  } catch {
    throw new Error(translate('err_json_parse_failed', creds.lang ?? 'tr'));
  }
}

// ============================================================================
// MODÜL 2: SADECE ANAHTAR KELİME ÜRETİMİ VE TAMAMLAMA (GROQ API 2)
// ============================================================================

const KEYWORDS_BY_PLATFORM: Record<string, string> = {
  adobe: 'Adobe Stock (max 49 keywords, broad to specific)',
  shutterstock: 'Shutterstock (max 50 keywords, high commercial value)',
  istock: 'iStock and Getty (max 50 keywords, Getty controlled vocabulary preferred)',
};

const KEYWORDS_PROMPT = `You are a microstock SEO expert. Generate optimized English keywords for {platform}.{hint}

First, interpret the image for key elements: human subjects, location/setting, events/actions, objects, concepts, and industries.

Three-tier structure (critical for ranking and commercial sales):
- Keywords 1–10 (Scene Anchors & User Note Terms): Extract exact concepts from the User Note (if provided) as top keywords (e.g. worker, forklift, warehouse, shelf, carton, colleague, blue collar). Name main visible subjects, specific activities, gear, and place.
- Keywords 11–34 (Broad Descriptive Context): Environmental terms, tools, relationships, secondary actions, lighting, and composition.
- Keywords 35–50 (High-Value Commercial & Abstract Concepts): MANDATORY commercial search terms related to the theme (e.g., occupational safety, supply chain, logistics, efficiency, business management, workplace wellness, industrial concept).

Rules (follow strictly):
- Order strictly: positions 1–10 = anchors & user note terms; 11–34 = context; 35–50 = commercial/abstract concepts.
- Use singular form only. NEVER combine singular and plural with a slash — write "wave" not "wave/waves", "dog" not "dog/dogs". Pick one form only.
- Every entry must be a short keyword or keyword phrase (1–3 words max), NEVER a sentence.
- VARIETY IS MANDATORY: Do NOT list repetitive synonyms of the same object. Pick 1 or 2 best terms for an object and expand into human presence, setting, mood, action, and industry.

Output format (critical): Your response must be exactly one line of comma-separated keywords — bare terms only. No introductory phrase, no sentences, no bullet points. Generate exactly 50 keywords.`;

const KEYWORDS_ALL_PLATFORMS =
  'Adobe Stock, Shutterstock, and iStock/Getty (one unified list of 50 English keywords optimized for all three microstock platforms)';

const LAYOUT_LABEL_RE = /\b(top|bottom|middle|center)\s+(left|right|center)\b|\bclose[\s-]?up\s+of\b|\(side view\)/i;
const STRAY_SYMBOL_RE = /[<>{}[\]\\|`^~_]|<\/?think>/i;

// 3. MADDE: Negatif Kelime / Mantık Filtresi (Jenerik / Çelişkili Kelime Engeli)
const IRRELEVANT_GENERIC_RE = /\b(image|photo|photograph|picture|background|copyspace|copy space|isolated|studio shot|horizontal|vertical|nobody|no people|looking at camera)\b/i;

function stripAnnotation(s: string): string {
  return s.replace(/\s*\(/g, ' (').replace(/\s*\([^)]*\)?\s*$/, '').trim();
}

const SENTENCE_VERB_RE = /\b(is|are|was|were|has|have|shows?|depicts?|contains?|appears?|working|suggesting|looking|seemingly)\b/i;
const LEADING_ARTICLE_RE = /^(the|a|an)\s+/i;
const META_PHRASE_RE = /\bkeywords?|keyword list|top image|bottom image|the image\b/i;

/** Groq filtresi — SADECE Groq tarafından üretilen kelimeleri denetler. Everypixel kelimelerine UYGULANMAZ. */
function looksLikeKeyword(s: string): boolean {
  if (!s) return false;
  if (s.includes(':')) return false;
  if (STRAY_SYMBOL_RE.test(s)) return false;
  if (LAYOUT_LABEL_RE.test(s)) return false;
  if (META_PHRASE_RE.test(s)) return false;
  if (HEDGE_EN_RE.test(s) || HEDGE_TR_RE.test(s)) return false;
  
  // 3. Madde Uygulaması: "photo", "image", "copyspace" gibi gereksiz teknik kelimeleri listeden eliyoruz
  if (IRRELEVANT_GENERIC_RE.test(s)) return false;

  const openParens = (s.match(/\(/g) ?? []).length;
  const closeParens = (s.match(/\)/g) ?? []).length;
  if (openParens !== closeParens) return false;

  const wordCount = s.split(/\s+/).filter(Boolean).length;
  if (wordCount === 0 || wordCount > 3) return false;
  if (LEADING_ARTICLE_RE.test(s) && wordCount >= 2) return false;
  if (wordCount >= 2 && SENTENCE_VERB_RE.test(s)) return false;

  return /[a-zA-Z]/.test(s);
}

function parseKeywordCsv(raw: string, whitelistTerms?: Set<string>): string[] {
  const cleaned = normalizeModelJsonRaw(raw);
  const seen = new Set<string>();
  return cleaned
    .split(/[,;\n]+/)
    .map((k) => {
      const trimmed = k
        .replace(/^[\s"'*\-–—]+/, '')
        .replace(/^\d+[.)]\s*/, '')
        .replace(/["'*\-–—.\s]+$/, '')
        .trim();
      return stripAnnotation(trimmed);
    })
    .filter((k) => {
      if (!k) return false;
      const lower = k.toLowerCase();
      // Everypixel veya Whitelist terimleri filtreden Muaf tutulur:
      if (whitelistTerms && whitelistTerms.has(lower)) return true;
      return looksLikeKeyword(k);
    })
    .filter((k) => {
      const lower = k.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
}

const KEYWORDS_TARGET = 50;

/** Everypixel eksik kelime dönerse veya hiç kullanılmazsa kalan kısmı Groq ile 50'ye tamamlar. */
export async function topUpKeywords(existing: string[], creds: AiCreds, hint: string): Promise<string[]> {
  if (existing.length >= KEYWORDS_TARGET) return existing.slice(0, KEYWORDS_TARGET);
  const need = KEYWORDS_TARGET - existing.length;
  const hintTxt = hint.trim() ? `\nContext/User Note: ${hint.trim()}` : '';
  const prompt = `You are a microstock SEO expert. Based on this existing list of English keywords and User Note, generate ${need} ADDITIONAL distinct English keywords (1-3 words max, varied concepts: human presence, location, events, industry). Extract key terms from the User Note if missing. Include commercial concepts (e.g. logistics, safety, efficiency). Do NOT repeat existing keywords or synonyms. Singular form only.${hintTxt}

Existing keywords: ${existing.join(', ')}

Output format: exactly one line of comma-separated keywords, nothing else.`;
  try {
    const raw = await groqText(prompt, creds, 600);
    // Existing (Everypixel) kelimeleri whitelist olarak gönderip filtrelerden muaf tutuyoruz:
    const whitelist = new Set(existing.map((e) => e.toLowerCase().trim()));
    const more = parseKeywordCsv(raw, whitelist);
    return fillKeywordsToMax(existing, KEYWORDS_TARGET, more);
  } catch {
    return existing;
  }
}

/** Groq ile Sıfırdan Anahtar Kelime Üretimi (Everypixel olmadığında çalışır) */
export async function apiKeywords(
  b64: string,
  creds: AiCreds,
  hint = '',
  platform: 'adobe' | 'shutterstock' | 'istock' = 'adobe'
): Promise<string[]> {
  const hintTxt = hint.trim() ? `\nExtra Context / User Note (PRIORITY KEYWORDS): ${hint}` : '';
  const platformNote = KEYWORDS_BY_PLATFORM[platform] ?? 'microstock platforms';
  const prompt = KEYWORDS_PROMPT.replace('{platform}', platformNote).replace('{hint}', hintTxt);
  const raw = await groqVision(b64, prompt, creds, 1800);
  return topUpKeywords(parseKeywordCsv(raw), creds, hint);
}

export async function apiKeywordsAllPlatforms(
  b64: string,
  creds: AiCreds,
  hint = ''
): Promise<string[]> {
  const hintTxt = hint.trim() ? `\nExtra Context / User Note (PRIORITY KEYWORDS): ${hint}` : '';
  const prompt = KEYWORDS_PROMPT.replace('{platform}', KEYWORDS_ALL_PLATFORMS).replace('{hint}', hintTxt);
  const raw = await groqVision(b64, prompt, creds, 1800);
  return topUpKeywords(parseKeywordCsv(raw), creds, hint);
}

// ============================================================================
// MODÜL 3: HİBRİT ORKESTRASYON (BAŞLIK, AÇIKLAMA VE KELİME BİRLEŞTİRİCİ)
// ============================================================================

/** Hem başlık/açıklamayı (Groq API 1) hem de anahtar kelimeleri (Everypixel / Groq API 2) bağımsız ve paralel çalıştırır. */
export async function apiMetadataWithKeywords(
  b64: string,
  creds: AiCreds,
  hint: string,
  lang: SecondaryLanguage,
  initialKeywords: string[] = [] // Everypixel'den gelen ham kelimeler (varsa)
): Promise<{
  title_en: string;
  title_secondary: string;
  description_en: string;
  description_secondary: string;
  keywords: string[];
}> {
  // Başlık/Açıklama (API 1) ve Kelime Tamamlama (API 2) bağımsız çalışır
  const metaPromise = apiMetadata(b64, creds, hint, lang);
  
  let kwPromise: Promise<string[]>;
  if (initialKeywords.length >= 50) {
    // Everypixel zaten 50 kelime vermişse doğrudan kullan
    kwPromise = Promise.resolve(initialKeywords.slice(0, 50));
  } else if (initialKeywords.length > 0) {
    // Everypixel eksik verdiyse Groq ile tamamla
    kwPromise = topUpKeywords(initialKeywords, creds, hint);
  } else {
    // Everypixel yoksa tüm kelimeleri Groq üretsin
    kwPromise = apiKeywordsAllPlatforms(b64, creds, hint);
  }

  const [meta, keywords] = await Promise.all([metaPromise, kwPromise]);
  return { ...meta, keywords };
}

// ============================================================================
// ÇEVİRİ VE YARDIMCI FONKSİYONLAR
// ============================================================================

export async function apiTranslate(text: string, toLang: 'tr' | 'en', creds: AiCreds): Promise<string> {
  const lang = toLang === 'tr' ? 'Türkçe' : 'English';
  const trExtra =
    toLang === 'tr'
      ? ' Use direct Turkish; do not add hedging or uncertainty. For comma-separated keyword lists, translate each term plainly without adding qualifiers.'
      : '';
  return groqText(
    `Translate to ${lang}. Keep it natural and professional.${trExtra} Return ONLY the translation:\n\n${text}`,
    creds,
    350
  );
}

export async function apiTranslateKw(kws: string[], creds: AiCreds): Promise<string[]> {
  try {
    const chunk = kws.slice(0, 50).join(', ');
    const raw = await apiTranslate(chunk, 'tr', creds);
    const parts = raw.split(',').map((p) => p.trim());
    return [...parts, ...kws].slice(0, kws.length);
  } catch {
    return kws;
  }
}

export function fillKeywordsToMax(existing: string[], max: number, candidates: string[]): string[] {
  const set = new Set(existing.map((k) => k.toLowerCase().trim()));
  const out = [...existing];
  for (const k of candidates) {
    if (out.length >= max) break;
    const t = k.trim();
    if (!t || set.has(t.toLowerCase())) continue;
    set.add(t.toLowerCase());
    out.push(t);
  }
  return out;
}

const TR_KW_BATCH_SIZE = 25;
function buildNumberedTranslatePrompt(langName: string): string {
  return `Translate each numbered line to ${langName}. Keep the same numbers. Return ONLY the numbered ${langName} translations, one per line. No other text.\n\n`;
}

function parseNumberedLines(raw: string, fallback: string[]): string[] {
  const out = [...fallback];
  const re = /^\s*(\d+)\.\s*(.*)$/;
  for (const line of raw.split('\n')) {
    const m = line.trim().match(re);
    if (m) {
      const num = parseInt(m[1], 10);
      const text = m[2].trim();
      if (num >= 1 && num <= fallback.length) out[num - 1] = text || fallback[num - 1];
    }
  }
  return out;
}

export async function apiTranslateKwNumbered(kws: string[], creds: AiCreds, lang: SecondaryLanguage): Promise<string[]> {
  if (kws.length === 0) return [];
  const list = kws.slice(0, 50);
  const prompt = buildNumberedTranslatePrompt(lang.name);
  const chunks: string[][] = [];
  for (let i = 0; i < list.length; i += TR_KW_BATCH_SIZE) chunks.push(list.slice(i, i + TR_KW_BATCH_SIZE));
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const input = chunk.map((w, j) => `${j + 1}. ${w}`).join('\n');
        const raw = await groqText(prompt + input, creds, 400);
        return parseNumberedLines(raw, chunk);
      } catch {
        return chunk;
      }
    })
  );
  return results.flat();
}

export function buildUniqueEnList(adobeEn: string[], shutterEn: string[], istockEn: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of [adobeEn, shutterEn, istockEn]) {
    for (const k of list) {
      const t = (k ?? '').trim();
      if (!t) continue;
      const lower = t.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      out.push(t);
    }
  }
  return out;
}

export async function apiTranslateUniqueKwToMap(uniqueEn: string[], creds: AiCreds, lang: SecondaryLanguage): Promise<Map<string, string>> {
  const trMap = new Map<string, string>();
  if (uniqueEn.length === 0) return trMap;
  const list = uniqueEn.slice(0, 150);
  const prompt = buildNumberedTranslatePrompt(lang.name);
  const chunks: string[][] = [];
  for (let i = 0; i < list.length; i += TR_KW_BATCH_SIZE) chunks.push(list.slice(i, i + TR_KW_BATCH_SIZE));
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const input = chunk.map((w, j) => `${j + 1}. ${w}`).join('\n');
        const raw = await groqText(prompt + input, creds, 400);
        return { chunk, trChunk: parseNumberedLines(raw, chunk) };
      } catch {
        return { chunk, trChunk: chunk };
      }
    })
  );
  for (const { chunk, trChunk } of results) {
    for (let j = 0; j < chunk.length; j++) {
      trMap.set(chunk[j].toLowerCase(), trChunk[j] ?? chunk[j]);
    }
  }
  return trMap;
}

export function applyTrMap(enList: string[], trMap: Map<string, string>): string[] {
  return enList.map((en) => {
    const t = (en ?? '').trim();
    if (!t) return '';
    return trMap.get(t.toLowerCase()) ?? t;
  });
}

function buildSecondaryTranslatePrompt(lang: SecondaryLanguage): string {
  const trExtra =
    lang.code === 'tr'
      ? ' Do not add hedging.'
      : ' Do not add hedging or uncertainty words.';
  return (
    `Translate the following to natural ${lang.name} for stock/advertising copy. Return only the ${lang.name} text, no explanation or quotes. ` +
    `Use direct, confident wording;${trExtra} ` +
    'Prefer affirmative present-tense that mirrors the source without softening.\n\n'
  );
}

export async function apiTranslateSecondary(text: string, creds: AiCreds, lang: SecondaryLanguage): Promise<string> {
  const t = (text ?? '').trim();
  if (!t) return '';
  const raw = await groqText(buildSecondaryTranslatePrompt(lang) + t, creds, 400);
  return (raw ?? '').trim() || t;
}

function buildEnglishTranslatePrompt(lang: SecondaryLanguage): string {
  return (
    `Translate the following ${lang.name} text to natural English for stock/advertising copy. Return only the English text, no explanation or quotes. ` +
    'Use direct, confident wording; do not add hedging or uncertainty words. ' +
    'Prefer affirmative present-tense that mirrors the source without softening.\n\n'
  );
}

export async function apiTranslateToEnglish(text: string, creds: AiCreds, lang: SecondaryLanguage): Promise<string> {
  const t = (text ?? '').trim();
  if (!t) return '';
  const raw = await groqText(buildEnglishTranslatePrompt(lang) + t, creds, 400);
  return (raw ?? '').trim() || t;
}