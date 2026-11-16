import { ApiError } from '../../lib/http.js';
import { clientAuth, oauthHandler, oauthJson, readBody, sha256Hex } from '../../lib/oauth.js';
import { serviceClient } from '../../lib/supabase.js';

/**
 * POST /api/oauth/revoke (RFC 7009)
 * Revokes an access or refresh token. Always 200 for unknown tokens.
 */
export const onRequest = oauthHandler(async ({ request, env }) => {
  const body = await readBody(request);
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) throw new ApiError('token is required.', { status: 400, code: 'INVALID_REQUEST' });

  const { clientId, clientSecret } = clientAuth(request, body);
  if (!clientId) throw new ApiError('client_id is required.', { status: 401, code: 'INVALID_CLIENT' });

  const admin = serviceClient(env);
  const { data: client, error } = await admin
    .from('oauth_clients')
    .select('id, client_secret_hash')
    .eq('client_id', clientId)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) throw new ApiError('Could not load OAuth client.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!client) throw new ApiError('Unknown or revoked OAuth client.', { status: 401, code: 'INVALID_CLIENT' });
  if (clientSecret && (await sha256Hex(clientSecret)) !== client.client_secret_hash) {
    throw new ApiError('Invalid client credentials.', { status: 401, code: 'INVALID_CLIENT' });
  }

  const hash = await sha256Hex(token);
  const now = new Date().toISOString();
  const { data: byAccess, error: accessError } = await admin
    .from('oauth_tokens')
    .update({ revoked_at: now })
    .eq('client_uuid', client.id)
    .eq('token_hash', hash)
    .is('revoked_at', null)
    .select('id');
  if (accessError) throw new ApiError('Could not revoke token.', { status: 502, code: 'UPSTREAM_ERROR' });

  if (!byAccess?.length) {
    const { error: refreshError } = await admin
      .from('oauth_tokens')
      .update({ revoked_at: now })
      .eq('client_uuid', client.id)
      .eq('refresh_hash', hash)
      .is('revoked_at', null);
    if (refreshError) throw new ApiError('Could not revoke token.', { status: 502, code: 'UPSTREAM_ERROR' });
  }

  return oauthJson({});
}, { methods: ['POST'] });
