import { handle, badRequest } from '../../lib/http.js';
import { serviceClient } from '../../lib/supabase.js';

const DEFAULT_AVAILABILITY = { hasSub: true, hasDub: true, subEpisodes: null, dubEpisodes: null, override: false };

export const onRequest = handle(async ({ params, env }) => {
  const raw = String(params.id || '');
  if (!/^\d{1,10}$/.test(raw)) throw badRequest('Anime id must be a number.');
  const anilistId = Number(raw);

  let row = null;
  try {
    const client = serviceClient(env);
    const { data, error } = await client
      .from('availability_overrides')
      .select('anilist_id, has_sub, has_dub, sub_episodes, dub_episodes')
      .eq('anilist_id', anilistId)
      .maybeSingle();
    if (error) throw error;
    row = data;
  } catch (err) {
    console.warn('[availability] override lookup failed, using defaults:', err.message);
  }

  if (!row) return { data: { anilistId, ...DEFAULT_AVAILABILITY } };
  return {
    data: {
      anilistId,
      hasSub: Boolean(row.has_sub),
      hasDub: Boolean(row.has_dub),
      subEpisodes: row.sub_episodes ?? null,
      dubEpisodes: row.dub_episodes ?? null,
      override: true,
    },
  };
}, { methods: ['GET'] });
