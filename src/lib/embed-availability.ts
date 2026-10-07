import "server-only";
import { cacheKey, getCached, setCached } from "@/lib/data-cache";
import { cacheTtl } from "@/lib/config";

const PROBE_TIMEOUT_MS = 4000;

/**
 * Whether an embed URL actually serves a player.
 *
 * Providers signal "missing" differently: megaplay answers HTTP 200 with its
 * own error page, others use 404, and some (anixo) 403-block server probes
 * entirely — so: 404 → unavailable, 200 → inspect the body, anything else →
 * fail open and let the browser decide. Cached 6h.
 */
export async function isEmbedUrlAvailable(url: string): Promise<boolean> {
  const key = cacheKey("embedprobe", { url });
  const cached = getCached<boolean>(key);
  if (cached !== undefined) return cached;

  let available = true;
  try {
    const res = await fetch(url, {
      headers: { Referer: new URL(url).origin + "/" },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (res.status === 404) {
      available = false;
    } else if (res.ok) {
      const body = await res.text();
      available = !/Oops! Something went wrong|Error Code:\s*404/i.test(body);
    }
  } catch {
    available = true;
  }

  setCached(key, available, cacheTtl.details);
  return available;
}
