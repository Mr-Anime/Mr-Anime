import { ApiError, badRequest, handle, notFound } from '../../lib/http.js';
import { isAllowedRedirectUri, randomToken, sha256Hex } from '../../lib/oauth.js';
import { requireUser, serviceClient } from '../../lib/supabase.js';

function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    redirectUris: row.redirect_uris || [],
    createdAt: row.created_at,
  };
}

function redirectUrisFrom(body) {
  if (!Array.isArray(body?.redirectUris)) throw badRequest('Pass redirectUris as an array.');
  const uris = [...new Set(body.redirectUris.map((uri) => (typeof uri === 'string' ? uri.trim() : '')).filter(Boolean))];
  if (uris.length < 1 || uris.length > 5) throw badRequest('Register between 1 and 5 redirect URIs.');
  for (const uri of uris) {
    if (!isAllowedRedirectUri(uri)) {
      throw badRequest(`Redirect URI must use HTTPS (or http://localhost for development): ${uri}`);
    }
  }
  return uris;
}

/**
 * GET    /api/oauth/apps     list your OAuth apps
 * POST   /api/oauth/apps     create an app (client secret returned once)
 * DELETE /api/oauth/apps?id= revoke an app and its tokens
 */
export const onRequest = handle(async ({ request, env }) => {
  const { user } = await requireUser(request, env);
  const admin = serviceClient(env);

  if (request.method === 'GET') {
    const { data, error } = await admin
      .from('oauth_clients')
      .select('id, name, client_id, redirect_uris, created_at')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new ApiError('Could not load OAuth apps.', { status: 502, code: 'UPSTREAM_ERROR' });
    return { data: data.map(toApi) };
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const name = (typeof body?.name === 'string' ? body.name.trim() : '').slice(0, 50);
    if (!name) throw badRequest('App name is required.');
    const redirectUris = redirectUrisFrom(body);

    const clientId = randomToken('mra_client_', 16);
    const clientSecret = randomToken('mra_secret_', 32);
    const clientSecretHash = await sha256Hex(clientSecret);

    const { data, error } = await admin
      .from('oauth_clients')
      .insert({ user_id: user.id, name, client_id: clientId, client_secret_hash: clientSecretHash, redirect_uris: redirectUris })
      .select('id, name, client_id, redirect_uris, created_at')
      .single();
    if (error) throw new ApiError('Could not create OAuth app.', { status: 502, code: 'UPSTREAM_ERROR' });

    return { data: { ...toApi(data), clientSecret } };
  }

  if (request.method === 'DELETE') {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw badRequest('Pass ?id=<app id>.');

    const { data, error } = await admin
      .from('oauth_clients')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw new ApiError('Could not revoke OAuth app.', { status: 502, code: 'UPSTREAM_ERROR' });
    if (!data) throw notFound('OAuth app not found.');

    const now = new Date().toISOString();
    await admin.from('oauth_authorization_codes').delete().eq('client_uuid', id);
    await admin.from('oauth_tokens').update({ revoked_at: now }).eq('client_uuid', id).is('revoked_at', null);

    return { data: { id, revoked: true } };
  }

  throw badRequest('Unsupported method.');
}, { methods: ['GET', 'POST', 'DELETE'] });
