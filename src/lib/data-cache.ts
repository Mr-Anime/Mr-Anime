type Entry = { value: unknown; expiresAt: number };

const store = new Map<string, Entry>();

function prune(now: number) {
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

/**
 * Tiny process-local TTL cache used for AniList/TMDB responses.
 * Keeps us well inside AniList's 30 req/min limit and gives every
 * route handler free caching (also works per-instance on Vercel).
 */
export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached(key: string, value: unknown, ttlSeconds: number): void {
  const now = Date.now();
  if (store.size > 1000) prune(now);
  store.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
}

export function cacheKey(prefix: string, parts: unknown): string {
  return `${prefix}:${JSON.stringify(parts)}`;
}
