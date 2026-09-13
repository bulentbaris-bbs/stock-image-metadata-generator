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
