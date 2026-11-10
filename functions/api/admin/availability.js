import { ApiError, badRequest, handle } from '../../lib/http.js';
import { requireAdmin } from '../../lib/supabase.js';

const COLUMNS = 'anilist_id, has_sub, has_dub, sub_episodes, dub_episodes, updated_at, updated_by';

function toApi(row) {
  return {
    anilistId: row.anilist_id,
    hasSub: Boolean(row.has_sub),
    hasDub: Boolean(row.has_dub),
    subEpisodes: row.sub_episodes ?? null,
    dubEpisodes: row.dub_episodes ?? null,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function normalizeBody(body) {
  const anilistId = Number(body?.anilistId);
  if (!Number.isInteger(anilistId) || anilistId < 1) throw badRequest('anilistId must be a positive integer.');

  const nullablePositive = (value, name) => {
    if (value == null || value === '') return null;
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0) throw badRequest(`${name} must be a non-negative integer.`);
    return n;
  };

  return {
    anilist_id: anilistId,
    has_sub: Boolean(body.hasSub),
    has_dub: Boolean(body.hasDub),
    sub_episodes: nullablePositive(body.subEpisodes, 'subEpisodes'),
    dub_episodes: nullablePositive(body.dubEpisodes, 'dubEpisodes'),
  };
}

/** GET / DELETE (PATCH-style upsert on POST) for availability overrides. Admin only. */
export const onRequest = handle(async ({ request, env }) => {
  const { user, admin } = await requireAdmin(request, env);
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const { data, error } = await admin
      .from('availability_overrides')
      .select(COLUMNS)
      .order('updated_at', { ascending: false })
      .limit(500);
    if (error) throw new ApiError('Could not load overrides.', { status: 502, code: 'UPSTREAM_ERROR' });
    return { data: data.map(toApi) };
  }

  if (request.method === 'POST' || request.method === 'PUT') {
    const body = await request.json().catch(() => null);
    const row = normalizeBody(body);
    const { data, error } = await admin
      .from('availability_overrides')
      .upsert({ ...row, updated_by: user.id }, { onConflict: 'anilist_id' })
      .select(COLUMNS)
      .single();
    if (error) throw new ApiError('Could not save override.', { status: 502, code: 'UPSTREAM_ERROR' });
    return { data: toApi(data) };
  }

  if (request.method === 'DELETE') {
    const id = Number(url.searchParams.get('anilistId'));
    if (!Number.isInteger(id) || id < 1) throw badRequest('Pass ?anilistId=<number>.');
    const { error } = await admin.from('availability_overrides').delete().eq('anilist_id', id);
    if (error) throw new ApiError('Could not delete override.', { status: 502, code: 'UPSTREAM_ERROR' });
    return { data: { anilistId: id, deleted: true } };
  }

  throw badRequest('Unsupported method.');
}, { methods: ['GET', 'POST', 'PUT', 'DELETE'] });
