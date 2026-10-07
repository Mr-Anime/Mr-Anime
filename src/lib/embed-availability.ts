import "server-only";
import { cacheKey, getCached, setCached } from "@/lib/data-cache";
import { cacheTtl } from "@/lib/config";

const PROBE_TIMEOUT_MS = 4000;

/**
 * Whether an embed URL actually serves a player.
 *
 * Some providers only have certain audio languages per title — megaplay's
 * /dub file 404s when no dub exists, and it answers HTTP 200 with its own
 * error page, so we inspect the body. Network failures fail open (assume
 * available) so playback is never blocked by a probe hiccup. Cached 6h.
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
    if (res.ok) {
      const body = await res.text();
      available = !/Oops! Something went wrong|Error Code:\s*404/i.test(body);
    } else {
      available = false;
    }
  } catch {
    available = true;
  }

  setCached(key, available, cacheTtl.details);
  return available;
}
