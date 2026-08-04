import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

const STORE_NAME = 'istock-shared';
const KEY = 'library';

type LibraryMap = Record<string, string>;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default async (req: Request, _context: Context) => {
  const store = getStore(STORE_NAME);

  if (req.method === 'GET') {
    const data = ((await store.get(KEY, { type: 'json' })) as LibraryMap | null) ?? {};
    return jsonResponse(data);
  }

  if (req.method === 'POST') {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Expected an object of generic -> iStock term pairs' }, 400);
    }
    const current = ((await store.get(KEY, { type: 'json' })) as LibraryMap | null) ?? {};
    const merged: LibraryMap = { ...current };
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      const key = String(k).trim().toLowerCase();
      const value = String(v ?? '').trim();
      if (key && value) merged[key] = value;
    }
    await store.setJSON(KEY, merged);
    return jsonResponse(merged);
  }

  if (req.method === 'DELETE') {
    let body: { key?: string };
    try {
      body = (await req.json()) as { key?: string };
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
    const current = ((await store.get(KEY, { type: 'json' })) as LibraryMap | null) ?? {};
    const key = (body.key ?? '').trim().toLowerCase();
    if (key) delete current[key];
    await store.setJSON(KEY, current);
    return jsonResponse(current);
  }

  return jsonResponse({ error: 'Method Not Allowed' }, 405);
};

export const config = {
  path: '/api/istock-library',
};
