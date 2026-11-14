import { ApiError, badRequest, handle } from '../../lib/http.js';
import { requireAdmin } from '../../lib/supabase.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toApi(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    verified: Boolean(row.verified) || row.role === 'admin',
  };
}

/**
 * GET /api/admin/users?q=username   search profiles
 * PUT /api/admin/users              { userId, verified } toggle the verified badge
 */
export const onRequest = handle(async ({ request, env }) => {
  const { admin } = await requireAdmin(request, env);
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const q = (url.searchParams.get('q') || '').trim().replace(/[%_]/g, '');
    if (q.length < 2) return { data: [] };
    const { data, error } = await admin
      .from('profiles')
      .select('id, username, role, verified')
      .ilike('username', `%${q}%`)
      .order('username')
      .limit(20);
    if (error) throw new ApiError('Could not search users.', { status: 502, code: 'UPSTREAM_ERROR' });
    return { data: data.map(toApi) };
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const userId = String(body?.userId || '');
    if (!UUID_RE.test(userId)) throw badRequest('userId must be a UUID.');
    const verified = Boolean(body?.verified);

    const { data, error } = await admin
      .from('profiles')
      .update({ verified })
      .eq('id', userId)
      .select('id, username, role, verified')
      .single();
    if (error) throw new ApiError('Could not update this user.', { status: 502, code: 'UPSTREAM_ERROR' });

    const badge = Boolean(data.verified) || data.role === 'admin';
    const { error: syncError } = await admin.from('comments').update({ author_verified: badge }).eq('user_id', userId);
    if (syncError) console.warn('[admin] comment badge sync failed:', syncError.message);

    return { data: toApi(data) };
  }

  throw badRequest('Unsupported method.');
}, { methods: ['GET', 'PUT', 'POST'] });
