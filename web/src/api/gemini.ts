import type { SecondaryLanguage } from '../lib/languages';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_VISION_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_REQUEST_MS = 60000;

export async function geminiVision(
  b64: string,
  prompt: string,
  apiKey: string,
  maxTokens = 1200
): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GEMINI_VISION_MODEL,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          { type: 'text', text: prompt }
        ]
      }]
    }),
    signal: AbortSignal.timeout(GEMINI_REQUEST_MS)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini hata (${res.status}): ${err.slice(0, 200)}`);
  }
  const data = await res.json();

  // Token kullanımını logla
  if (data.usage) {
    const input = data.usage.prompt_tokens ?? 0;
    const output = data.usage.completion_tokens ?? 0;
    const inputCost = (input / 1_000_000) * 0.30;
    const outputCost = (output / 1_000_000) * 2.50;
    const totalCostUSD = inputCost + outputCost;
    const totalCostTRY = totalCostUSD * 38; // yaklaşık kur
    console.log(
      `[Gemini] input: ${input} token, output: ${output} token | ` +
      `maliyet: $${totalCostUSD.toFixed(6)} (~${totalCostTRY.toFixed(4)} TL)`
    );
  }

  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function geminiText(
  prompt: string,
  apiKey: string,
  maxTokens = 400
): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GEMINI_VISION_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    }),
    signal: AbortSignal.timeout(GEMINI_REQUEST_MS)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini text hata (${res.status}): ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data.usage) {
    const input = data.usage.prompt_tokens ?? 0;
    const output = data.usage.completion_tokens ?? 0;
    const cost = ((input * 0.30) + (output * 2.50)) / 1_000_000 * 38;
    console.log(`[Gemini Text] input: ${input}, output: ${output} | ~${cost.toFixed(4)} TL`);
  }
  return data?.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function geminiTranslate(
  text: string,
  lang: SecondaryLanguage,
  apiKey: string
): Promise<string> {
  const prompt = `Translate to ${lang.name}. Return ONLY the translation, nothing else:\n\n${text}`;
  return geminiText(prompt, apiKey, 300);
}

export async function apiTranslateUniqueKwToMapWithGemini(
  uniqueEn: string[],
  apiKey: string,
  lang: SecondaryLanguage
): Promise<Map<string, string>> {
  const chunks: string[][] = [];
  for (let i = 0; i < uniqueEn.length; i += 40) {
    chunks.push(uniqueEn.slice(i, i + 40));
  }

  const map = new Map<string, string>();

  for (const chunk of chunks) {
    const numbered = chunk.map((k, i) => `${i + 1}. ${k}`).join('\n');
    const prompt = `Translate each numbered keyword to ${lang.name}.
Output ONLY the translated words, one per line, same numbers.
No explanations, no commentary.

${numbered}`;

    try {
      const raw = await geminiText(prompt, apiKey, 400);
      const lines = raw.split('\n').filter(Boolean);
      lines.forEach((line, i) => {
        const match = line.match(/^\d+[.)]\s*(.+)/);
        const translation = match ? match[1].trim() : line.trim();
        if (chunk[i] && translation) {
          map.set(chunk[i].toLowerCase(), translation);
        }
      });
    } catch { /* chunk başarısız, atla */ }
  }

  return map;
}
