import { handle, badRequest, notFound } from '../../lib/http.js';
import { anilistQuery, MEDIA_DETAIL_QUERY } from '../../lib/anilist.js';
import { toMedia } from '../../lib/map.js';

export const onRequest = handle(async ({ params, env }) => {
  const raw = String(params.id || '');
  if (!/^\d{1,10}$/.test(raw)) throw badRequest('Anime id must be a number.');
  const id = Number(raw);

  const data = await anilistQuery(MEDIA_DETAIL_QUERY, { id }, { env });
  if (!data?.Media) throw notFound('Anime not found.');
  return { data: toMedia(data.Media) };
}, { methods: ['GET'] });
