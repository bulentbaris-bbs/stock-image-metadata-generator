import type { IStockMap } from '../types';

const ENDPOINT = '/api/istock-library';

/** Pull the current shared library. Returns {} on any failure (offline, local dev without `netlify dev`, etc.) — never throws. */
export async function fetchSharedIstockLibrary(): Promise<IStockMap> {
  try {
    const res = await fetch(ENDPOINT);
    if (!res.ok) return {};
    return (await res.json()) as IStockMap;
  } catch {
    return {};
  }
}

/** Merge-push entries into the shared library (server-side merge; never deletes). Fire-and-forget friendly — swallows errors. */
export async function pushSharedIstockEntries(entries: IStockMap): Promise<IStockMap | null> {
  if (Object.keys(entries).length === 0) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entries),
    });
    if (!res.ok) return null;
    return (await res.json()) as IStockMap;
  } catch {
    return null;
  }
}

/** Remove a single key from the shared library. */
export async function deleteSharedIstockEntry(key: string): Promise<void> {
  try {
    await fetch(ENDPOINT, {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key }),
    });
  } catch {
    // local removal already applied; shared sync is best-effort
  }
}
