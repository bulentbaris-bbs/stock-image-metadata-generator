/** OpenRouter fallback, used only when every Groq key is rate-limited. Routes through openrouter/auto so it automatically picks a currently-available free model. */
import { translate, type UILang } from '../lib/i18n';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = 'openrouter/auto';
const OPENROUTER_REQUEST_MS = 90000;
// OpenRouter requires these on every request for attribution/analytics.
const OPENROUTER_REFERER = 'https://stock-metadata-generator.netlify.app';
const OPENROUTER_APP_TITLE = 'Stock Metadata Generator';

async function openRouterChat(
  messages: Array<{ role: string; content: unknown }>,
  key: string,
  maxTokens: number,
  label: string,
  lang: UILang,
): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OPENROUTER_REQUEST_MS);
  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': OPENROUTER_REFERER,
        'X-Title': OPENROUTER_APP_TITLE,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        max_tokens: maxTokens,
      }),
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
    const content = (data?.choices?.[0]?.message?.content ?? '').trim();
    return content;
  }

  const text = await res.text();
  if (res.status === 401 || res.status === 403) {
    throw new Error(translate('err_api_key_invalid', lang, { label }));
  }
  if (res.status === 429) {
    throw new Error(translate('err_rate_limited', lang, { label }));
  }
  throw new Error(translate('err_server_error', lang, { label, status: res.status, text: text.slice(0, 200) }));
}

export async function openRouterVision(b64: string, prompt: string, key: string, maxTokens = 700, lang: UILang = 'tr'): Promise<string> {
  return openRouterChat(
    [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    key,
    maxTokens,
    'OpenRouter vision',
    lang,
  );
}

export async function openRouterText(prompt: string, key: string, maxTokens = 500, lang: UILang = 'tr'): Promise<string> {
  return openRouterChat([{ role: 'user', content: prompt }], key, maxTokens, 'OpenRouter text', lang);
}
