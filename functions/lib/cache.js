const MIN_TTL_SECONDS = 30;

/** KV cache read-through. Returns the producer result when KV is absent or stale. */
export async function cachedJson(env, key, ttlSeconds, producer, { refresh = false } = {}) {
  const kv = env.MRANIME_CACHE;
  if (!kv) return producer();

  if (!refresh) {
    try {
      const hit = await kv.get(key);
      if (hit != null) return JSON.parse(hit);
    } catch (err) {
      console.warn(`[cache] read failed for ${key}:`, err.message);
    }
  }

  const value = await producer();
  try {
    const ttl = Math.max(MIN_TTL_SECONDS, Number(ttlSeconds) || 0);
    await kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch (err) {
    console.warn(`[cache] write failed for ${key}:`, err.message);
  }
  return value;
}

/** Number of keys under a prefix (used by admin stats "cachedShows"). */
export async function countKeys(env, prefix) {
  const kv = env.MRANIME_CACHE;
  if (!kv) return 0;
  let cursor;
  let count = 0;
  try {
    do {
      const res = await kv.list({ prefix, cursor });
      count += res.keys?.length || 0;
      cursor = res.list_complete ? undefined : res.cursor;
    } while (cursor);
  } catch {
    return count;
  }
  return count;
}
