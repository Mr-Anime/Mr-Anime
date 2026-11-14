import { ApiError, badRequest, handle } from '../../lib/http.js';
import { requireUser, serviceClient } from '../../lib/supabase.js';
import { generateApiToken, hashApiToken } from '../../lib/tokens.js';

function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

/**
 * GET    /api/dev/tokens     list active tokens for the signed-in user
 * POST   /api/dev/tokens     create a token (raw value returned once)
 * DELETE /api/dev/tokens?id= revoke a token
 */
export const onRequest = handle(async ({ request, env }) => {
  const { user } = await requireUser(request, env);
  const admin = serviceClient(env);

  if (request.method === 'GET') {
    const { data, error } = await admin
      .from('api_tokens')
      .select('id, name, prefix, created_at, last_used_at')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new ApiError('Could not load API tokens.', { status: 502, code: 'UPSTREAM_ERROR' });
    return { data: data.map(toApi) };
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const name = (typeof body?.name === 'string' ? body.name.trim() : '').slice(0, 50) || 'API token';

    const token = generateApiToken();
    const tokenHash = await hashApiToken(token);
    const { data, error } = await admin
      .from('api_tokens')
      .insert({ user_id: user.id, name, prefix: token.slice(0, 12), token_hash: tokenHash })
      .select('id, name, prefix, created_at, last_used_at')
      .single();
    if (error) throw new ApiError('Could not create API token.', { status: 502, code: 'UPSTREAM_ERROR' });

    return { data: { ...toApi(data), token } };
  }

  if (request.method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw badRequest('Pass ?id=<token id>.');
    const { error } = await admin
      .from('api_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw new ApiError('Could not revoke API token.', { status: 502, code: 'UPSTREAM_ERROR' });
    return { data: { id, revoked: true } };
  }

  throw badRequest('Unsupported method.');
}, { methods: ['GET', 'POST', 'DELETE'] });
