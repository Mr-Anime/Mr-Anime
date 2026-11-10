import { handle, badRequest } from '../../lib/http.js';
import { anilistQuery, BATCH_QUERY } from '../../lib/anilist.js';
import { toCard } from '../../lib/map.js';

const MAX_IDS = 50;

/** GET /api/anime/batch?ids=1,2,3 -> { data: Card[] } (missing ids omitted). */
export const onRequest = handle(async ({ request }) => {
  const idsParam = new URL(request.url).searchParams.get('ids') || '';
  const ids = [...new Set(idsParam.split(',').map((s) => s.trim()).filter((s) => /^\d{1,10}$/.test(s)).map(Number))];
  if (!ids.length) throw badRequest('Pass at least one numeric id in ?ids=.');
  if (ids.length > MAX_IDS) throw badRequest(`At most ${MAX_IDS} ids per request.`);

  const data = await anilistQuery(BATCH_QUERY, { ids });
  const cards = (data?.Page?.media || []).map(toCard).filter(Boolean);
  const byId = new Map(cards.map((c) => [c.id, c]));
  return { data: ids.map((id) => byId.get(id)).filter(Boolean) };
}, { methods: ['GET'] });
