const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function groqVision(
  b64: string,
  prompt: string,
  key: string,
  maxTokens = 700
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq vision: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? '').trim();
}

export async function groqText(
  prompt: string,
  key: string,
  maxTokens = 500
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq text: ${res.status} ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? '').trim();
}

/** Core instructions; optional REFERENCE block is prepended when hint is non-empty. */
const METADATA_INSTRUCTIONS = `You are a professional stock photo metadata expert. Analyze this image for Adobe Stock, Shutterstock, iStock.

Consider: current market trends, buyer search behavior, commercial appeal, and SEO best practices.
Focus on what buyers actually search for on Adobe Stock, Shutterstock, and iStock.

Output format (critical): Return ONLY valid JSON with ALL four keys as non-empty strings. Never omit a field. Never use null or empty strings.
{"title_en":"...","title_tr":"...","description_en":"...","description_tr":"..."}

Title (title_en / title_tr) — what is visible (agency-style, buyer-facing):
- State clearly what the image is about: main subject, action, and setting. Use "Who, What, Where, When" where helpful (one or two complete sentences if needed).
- Target: up to 200 characters per title (including spaces). Be specific and complete; avoid vague one-liners when more detail would clarify the topic.
- Strong anchors (use when relevant to the image): region/country or named place if clearly inferable; environment (underwater, factory floor, etc.); shot feel (e.g. POV, wide shot, underwater shot) if it matches the frame; visible gear or role (hard hat, freediving, etc.).
- For faceless or abstract commercial scenes, prefer phrasing like "unrecognizable …" when appropriate and name the theme (e.g. occupational health and safety concept, corporate wellness concept).
- Avoid weak bare patterns like "Man doing X" or "X in Y" with no extra detail when the image supports richer wording.
- Natural prose only; do NOT stack comma-separated keywords or tags. Readable sentences beat keyword lists.
- Both EN and TR must convey the same meaning.

Description (description_en / description_tr) — complementary detail ONLY (REQUIRED, never empty):
- The title summarizes the scene; descriptions MUST add different information focused on topic and content, not generic production talk. Prioritize: what is happening (actions, sequence), who or what is involved (roles, objects, equipment, symbols), relationships between elements, setting and context (place type, industry, activity), and the narrative or theme the image communicates. Pick at least two concrete content angles the title does not already state.
- Do NOT center the description on lighting, mood, atmosphere, color palette, or composition unless one short phrase supports the subject (e.g. clinical lighting for a medical scene). Avoid filler about "warm tones" or "wide shot" when the image calls for subject detail instead.
- You may briefly mention typical buyer contexts (e.g. campaigns, editorial) only as a closing clause if space allows—not as the main substance.
- Tone (critical): Write in direct, declarative stock-copy style—state what the image shows. Do NOT use hedging or vague uncertainty in English or Turkish (e.g. probably, possibly, maybe, likely, seems, appears, might, could, perhaps; Turkish: muhtemelen, belki, sanırım, gibi görünüyor, olabilir). If a specific label is not visible, use concrete but general wording (e.g. coastal road, industrial interior) instead of guessing with qualifiers.
- Length: 150–200 characters each (minimum ~120). description_tr must be Turkish; description_en English.
- Do NOT paste or lightly rephrase the title. No duplicate sentences from the title.`;

/** Prepend strong reference rules so the model sees user intent before long instructions. */
export function buildMetadataVisionPrompt(hint: string): string {
  const t = hint.trim();
  if (!t) return METADATA_INSTRUCTIONS;
  const safe = JSON.stringify(t);
  return `REFERENCE — USER NOTE (read first; apply when compatible with the image):
The user provided this note (string below may be Turkish, English, or mixed):
${safe}

MANDATORY:
- When the note aligns with what is clearly visible (subject, setting, mood, intended use, commercial angle, or style), you MUST reflect it in title_en, title_tr, description_en, and description_tr. Paraphrase naturally; integrate meaning—do not ignore the note.
- If the note contradicts visible facts in the image, ignore the conflicting parts and describe only what the image shows.
- Do not paste the note verbatim as the entire title or description.

---

${METADATA_INSTRUCTIONS}`;
}

/** Extract the first complete JSON object from a string (handles trailing text or multiple objects). */
function extractFirstJsonObject(raw: string): string {
  const start = raw.indexOf('{');
  if (start === -1) return '';
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return '';
}

async function fillDescriptionsFromTitles(
  key: string,
  titleEn: string,
  titleTr: string,
  hint: string,
): Promise<{ description_en: string; description_tr: string } | null> {
  const ref = hint.trim()
    ? `\nUser note (must shape tone/topics if compatible): ${JSON.stringify(hint.trim())}`
    : '';
  const p = `You are a microstock copywriter. Titles are fixed below. Write ONLY complementary image descriptions in English and Turkish.

Rules:
- Do NOT repeat or copy the title wording. Expand on topic and content: actions, objects, equipment, relationships, setting/context, and the theme or story—details the titles do not already state. Do not lead with lighting, mood, color, or composition unless one short phrase clarifies the subject.
- Use direct, declarative wording—no hedging (no probably, maybe, seems, likely, possibly; Turkish: muhtemelen, belki, sanırım, gibi görünüyor, olabilir). Describe what is visible; if unsure of a label, use concrete general terms instead of qualifiers.
- Each description 150-200 characters (minimum ~120). description_en in English, description_tr in Turkish.
- Return ONLY valid JSON: {"description_en":"...","description_tr":"..."}

title_en: ${titleEn}
title_tr: ${titleTr}${ref}`;
  try {
    const raw = await groqText(p, key, 550);
    const jsonStr = extractFirstJsonObject(raw);
    if (!jsonStr) return null;
    const o = JSON.parse(jsonStr) as Record<string, string>;
    const clip = (s: unknown, max: number) =>
      typeof s === 'string' ? (s.length > max ? s.slice(0, max) : s) : '';
    const en = clip(o.description_en, 2000);
    const tr = clip(o.description_tr, 2000);
    if (!en.trim() || !tr.trim()) return null;
    return { description_en: en, description_tr: tr };
  } catch {
    return null;
  }
}

export async function apiMetadata(
  b64: string,
  key: string,
  hint = ''
): Promise<{ title_en: string; title_tr: string; description_en: string; description_tr: string }> {
  const prompt = buildMetadataVisionPrompt(hint);
  const raw = await groqVision(b64, prompt, key, 1024);
  const jsonStr = extractFirstJsonObject(raw);
  if (!jsonStr) throw new Error('Invalid response: no JSON');
  try {
    const o = JSON.parse(jsonStr) as Record<string, string>;
    const clip = (s: unknown, max: number) =>
      typeof s === 'string' ? (s.length > max ? s.slice(0, max) : s) : '';
    let title_en = clip(o.title_en, 200);
    let title_tr = clip(o.title_tr, 200);
    let description_en = clip(o.description_en, 2000);
    let description_tr = clip(o.description_tr, 2000);
    if (!description_en.trim() || !description_tr.trim()) {
      const filled = await fillDescriptionsFromTitles(key, title_en, title_tr, hint);
      if (filled) {
        description_en = filled.description_en;
        description_tr = filled.description_tr;
      }
    }
    return { title_en, title_tr, description_en, description_tr };
  } catch (e) {
    throw new Error('Invalid response: JSON parse failed');
  }
}

const KEYWORDS_BY_PLATFORM: Record<string, string> = {
  adobe: 'Adobe Stock (max 49 keywords, broad to specific)',
  shutterstock: 'Shutterstock (max 50 keywords, high commercial value)',
  istock: 'iStock/Getty (max 50 keywords, Getty controlled vocabulary preferred)',
};

const KEYWORDS_PROMPT = `You are a microstock SEO expert. Generate optimized English keywords for {platform}.{hint}

First, interpret the image as a story in your mind only (who, what, why, when, where, concept). Do NOT output this story or any explanation—use it only internally to choose keywords.

Two-tier list (critical for ranking and automation):
- Keywords 1–10 (FIRST in the comma-separated list): Scene anchors — highest commercial value. Specific activity, place/region or sea if visible, main subject, equipment, setting, industry. Avoid vague filler in positions 1–10.
- Keywords 11–50: Broader conceptual / thematic terms (mood, season, travel, compliance, freedom, discovery, risk, vacation, etc.) that buyers still search. Do not repeat the same wording as 1–10; add new angles.

Keyword rules (follow strictly):
- Order strictly: positions 1–10 = anchors; 11–50 = conceptual expansion. Adobe Stock and Getty rank early positions higher.
- Specific to general: (1) Specific subject/activity, (2) Place/setting/industry, (3) Objects/gear, (4) Then concepts/themes.
- Use singular form only; do not add plural variants (e.g. "dog" not "dogs") to save the keyword limit.
- Include conceptual tags that reflect the mood or message in positions 11–50 (e.g. discovery, compliance, freedom).
- Only tag what is clearly visible and central to the image; do not add small background objects or elements that are not the main subject.

Also consider: buyer trends (2024-2025), commercial use (advertising, editorial, web, print), emotions, technical aspects, location/demographics if visible.

Output format (critical): Your response must be exactly one line of comma-separated keywords. No introductory phrase (e.g. no "Here are the keywords:"), no sentences, no bullet points, no story text. Example: freediving, underwater, Halkidiki, Greece, marine life, Aegean sea, clear water, diving, adventure, action camera, discovery, extreme sport, nature, summer, freedom, vacation, travel, deep. Generate exactly 50 keywords.`;

export async function apiKeywords(
  b64: string,
  key: string,
  hint = '',
  platform: 'adobe' | 'shutterstock' | 'istock' = 'adobe'
): Promise<string[]> {
  const hintTxt = hint.trim() ? `\nExtra context (important): ${hint}` : '';
  const platformNote = KEYWORDS_BY_PLATFORM[platform] ?? 'microstock platforms';
  const prompt = KEYWORDS_PROMPT.replace('{platform}', platformNote).replace('{hint}', hintTxt);
  const raw = await groqVision(b64, prompt, key, 450);
  const kws = raw
    .replace(/["'*\-\n\d.]/g, '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  return kws.slice(0, 50);
}

export async function apiTranslate(text: string, toLang: 'tr' | 'en', key: string): Promise<string> {
  const lang = toLang === 'tr' ? 'Türkçe' : 'English';
  return groqText(
    `Translate to ${lang}. Keep it natural and professional. Return ONLY the translation:\n\n${text}`,
    key,
    350
  );
}

export async function apiTranslateKw(kws: string[], key: string): Promise<string[]> {
  try {
    const chunk = kws.slice(0, 50).join(', ');
    const raw = await apiTranslate(chunk, 'tr', key);
    const parts = raw.split(',').map((p) => p.trim());
    return [...parts, ...kws].slice(0, kws.length);
  } catch {
    return kws;
  }
}
