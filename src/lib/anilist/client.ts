import "server-only";
import { cacheKey, getCached, setCached } from "@/lib/data-cache";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

/** Dedupe concurrent identical requests (e.g. metadata + page render). */
const inflight = new Map<string, Promise<unknown>>();

export class AniListError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AniListError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST to the AniList GraphQL API with:
 *  - process-local TTL caching (trending 1h / details 6h / search 10m)
 *  - automatic retry with backoff on HTTP 429 (rate limit is 30 req/min)
 */
export async function anilistRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  ttlSeconds: number,
): Promise<T> {
  const key = cacheKey("anilist", { query, variables });
  const cached = getCached<T>(key);
  if (cached !== undefined) return cached;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = performRequest<T>(key, query, variables, ttlSeconds);
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

async function performRequest<T>(
  key: string,
  query: string,
  variables: Record<string, unknown>,
  ttlSeconds: number,
): Promise<T> {
  const body = JSON.stringify({ query, variables });

  const doFetch = () =>
    fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    });

  let response = await doFetch();

  // Retry on rate limiting (max 2 retries, honour Retry-After when present)
  for (let attempt = 0; attempt < 2 && response.status === 429; attempt++) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 30_000)
      : 2_000 * (attempt + 1);
    await sleep(waitMs);
    response = await doFetch();
  }

  if (!response.ok) {
    let detail = "";
    try {
      const errBody = (await response.json()) as { errors?: { message: string }[] };
      detail = errBody.errors?.[0]?.message ? `: ${errBody.errors[0].message}` : "";
    } catch {
      // ignore body parse failures
    }
    throw new AniListError(
      `AniList request failed (${response.status})${detail}`,
      response.status,
    );
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new AniListError(json.errors[0].message, 400);
  }
  if (json.data === undefined) {
    throw new AniListError("AniList returned no data", 502);
  }

  setCached(key, json.data, ttlSeconds);
  return json.data;
}
