import { ApiError } from '../../lib/http.js';
import { hasScope, oauthError, oauthHandler, oauthJson, sha256Hex } from '../../lib/oauth.js';
import { serviceClient } from '../../lib/supabase.js';
import { bearerToken } from '../../lib/tokens.js';

/** GET /api/oauth/userinfo — profile of the user who authorized the token. */
export const onRequest = oauthHandler(async ({ request, env }) => {
  const token = bearerToken(request);
  if (!token) {
    return oauthError('invalid_token', 'Bearer access token required.', 401, { 'www-authenticate': 'Bearer' });
  }

  const admin = serviceClient(env);
  const { data: row, error } = await admin
    .from('oauth_tokens')
    .select('id, user_id, scope, expires_at, revoked_at')
    .eq('token_hash', await sha256Hex(token))
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw new ApiError('Could not verify access token.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!row) {
    return oauthError('invalid_token', 'Invalid or expired access token.', 401, {
      'www-authenticate': 'Bearer error="invalid_token"',
    });
  }
  if (!hasScope(row.scope, 'read')) {
    return oauthError('insufficient_scope', 'Token lacks the read scope.', 403, {
      'www-authenticate': 'Bearer error="insufficient_scope"',
    });
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('username, avatar_url, verified')
    .eq('id', row.user_id)
    .maybeSingle();
  if (profileError) throw new ApiError('Could not load profile.', { status: 502, code: 'UPSTREAM_ERROR' });

  admin
    .from('oauth_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', row.id)
    .then(
      () => {},
      () => {},
    );

  return oauthJson({
    sub: row.user_id,
    username: profile?.username || null,
    avatar_url: profile?.avatar_url || null,
    verified: Boolean(profile?.verified),
    scope: row.scope,
  });
}, { methods: ['GET'] });
