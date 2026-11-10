import { handle } from '../lib/http.js';
import { anilistQuery, SCHEDULE_QUERY } from '../lib/anilist.js';
import { toScheduleItem } from '../lib/map.js';
import { cachedJson } from '../lib/cache.js';

const DAY_SECONDS = 86400;

function startOfUtcDay(seconds) {
  return Math.floor(seconds / DAY_SECONDS) * DAY_SECONDS;
}

/** Next 7 days of airing episodes, sorted by air time. */
export const onRequest = handle(async ({ request, env }) => {
  const sp = new URL(request.url).searchParams;
  const now = Math.floor(Date.now() / 1000);
  const offsetDays = Math.max(0, Math.min(6, Number(sp.get('offset')) || 0));
  const from = startOfUtcDay(now) + offsetDays * DAY_SECONDS;
  const to = startOfUtcDay(now) + 7 * DAY_SECONDS;

  const dayKey = new Date(from * 1000).toISOString().slice(0, 10);
  // Airing slots can be sparse and AniList caps a page at 50, so merge two
  // overlapping windows (de-duplicated per media+episode).
  const payload = await cachedJson(env, `schedule:v1:${dayKey}`, 900, async () => {
    const mid = from + Math.floor((to - from) / 2);
    const [a, b] = await Promise.all([
      anilistQuery(SCHEDULE_QUERY, { from, to: mid }),
      anilistQuery(SCHEDULE_QUERY, { from: mid, to }),
    ]);
    const seen = new Set();
    const list = [...(a?.Page?.airingSchedules || []), ...(b?.Page?.airingSchedules || [])]
      .filter((slot) => {
        const key = `${slot.media?.id}-${slot.episode}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(toScheduleItem);
    list.sort((x, y) => x.airingAt - y.airingAt);
    return { airingSchedules: list, range: { from, to } };
  });

  return payload;
}, { methods: ['GET'] });
