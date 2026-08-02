/** Gemini free-tier fallback, used only when the whole Groq key pool is rate-limited. */
const GEMINI_VISION_MODEL = 'gemini-2.0-flash';
const GEMINI_TEXT_MODEL = 'gemini-2.0-flash';
const GEMINI_REQUEST_MS = 90000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geminiGenerate(
  model: string,
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>,
  key: string,
  maxTokens: number,
  label: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  let delayMs = 3000;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), GEMINI_REQUEST_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
        signal: ctrl.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof Error && e.name === 'AbortError') {
        throw new Error(`${label}: İstek zaman aşımına uğradı (90s).`);
      }
      throw e;
    }
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
      return text.trim();
    }

    const text = await res.text();
    const retryable = res.status === 429 || res.status === 503;
    if (retryable && attempt < 3) {
      await sleep(delayMs);
      delayMs = Math.min(delayMs * 2, 30000);
      continue;
    }
    throw new Error(`${label}: ${res.status} ${text.slice(0, 200)}`);
  }
  throw new Error(`${label}: istek tamamlanamadı.`);
}

export async function geminiVision(b64: string, prompt: string, key: string, maxTokens = 700): Promise<string> {
  return geminiGenerate(
    GEMINI_VISION_MODEL,
    [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: b64 } }],
    key,
    maxTokens,
    'Gemini vision',
  );
}

export async function geminiText(prompt: string, key: string, maxTokens = 500): Promise<string> {
  return geminiGenerate(GEMINI_TEXT_MODEL, [{ text: prompt }], key, maxTokens, 'Gemini text');
}
