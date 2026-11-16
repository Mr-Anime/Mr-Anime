import { ApiError } from '../../lib/http.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  clientAuth,
  oauthHandler,
  oauthJson,
  pkceChallenge,
  randomToken,
  readBody,
  sha256Hex,
  validPkceVerifier,
} from '../../lib/oauth.js';
import { serviceClient } from '../../lib/supabase.js';

function str(value) {
  return typeof value === 'string' ? value : '';
}

function invalidGrant(description = 'The authorization grant is invalid, expired or already used.') {
  return new ApiError(description, { status: 400, code: 'INVALID_GRANT' });
}

async function verifyClientSecret(client, secret) {
  if (!secret) return false;
  return (await sha256Hex(secret)) === client.client_secret_hash;
}

async function issueTokens(admin, { clientUuid, userId, scope }) {
  const accessToken = randomToken('mrao_');
  const refreshToken = randomToken('mrar_');
  const now = Date.now();
  const { error } = await admin.from('oauth_tokens').insert({
    client_uuid: clientUuid,
    user_id: userId,
    token_hash: await sha256Hex(accessToken),
    refresh_hash: await sha256Hex(refreshToken),
    scope,
    expires_at: new Date(now + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString(),
    refresh_expires_at: new Date(now + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) throw new ApiError('Could not issue access token.', { status: 502, code: 'UPSTREAM_ERROR' });

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refreshToken,
    scope,
  };
}

async function exchangeCode(admin, client, request, body) {
  const code = str(body.code);
  const redirectUri = str(body.redirect_uri);
  const verifier = str(body.code_verifier);
  if (!code || !redirectUri) throw new ApiError('code and redirect_uri are required.', { status: 400, code: 'INVALID_REQUEST' });

  const { data: row, error } = await admin
    .from('oauth_authorization_codes')
    .select('id, client_uuid, user_id, redirect_uri, scope, code_challenge, code_challenge_method, expires_at, used_at')
    .eq('code_hash', await sha256Hex(code))
    .maybeSingle();
  if (error) throw new ApiError('Could not verify authorization code.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!row || row.used_at || new Date(row.expires_at) <= new Date()) throw invalidGrant();
  if (row.client_uuid !== client.id) throw invalidGrant();
  if (row.redirect_uri !== redirectUri) throw invalidGrant();

  const { clientSecret } = clientAuth(request, body);
  if (clientSecret) {
    if (!(await verifyClientSecret(client, clientSecret))) {
      throw new ApiError('Invalid client credentials.', { status: 401, code: 'INVALID_CLIENT' });
    }
  } else if (!row.code_challenge) {
    throw new ApiError('Client authentication or PKCE is required.', { status: 401, code: 'INVALID_CLIENT' });
  }

  if (row.code_challenge) {
    if (!validPkceVerifier(verifier)) throw invalidGrant('A valid code_verifier is required.');
    if ((await pkceChallenge(verifier)) !== row.code_challenge) throw invalidGrant('code_verifier does not match.');
  }

  const { data: consumed, error: consumeError } = await admin
    .from('oauth_authorization_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('used_at', null)
    .select('id')
    .maybeSingle();
  if (consumeError) throw new ApiError('Could not redeem authorization code.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!consumed) throw invalidGrant();

  return issueTokens(admin, { clientUuid: client.id, userId: row.user_id, scope: row.scope });
}

async function rotateRefreshToken(admin, client, request, body) {
  const refreshToken = str(body.refresh_token);
  if (!refreshToken) throw new ApiError('refresh_token is required.', { status: 400, code: 'INVALID_REQUEST' });

  const { clientSecret } = clientAuth(request, body);
  if (clientSecret && !(await verifyClientSecret(client, clientSecret))) {
    throw new ApiError('Invalid client credentials.', { status: 401, code: 'INVALID_CLIENT' });
  }

  const { data: row, error } = await admin
    .from('oauth_tokens')
    .select('id, client_uuid, user_id, scope, refresh_expires_at, revoked_at')
    .eq('refresh_hash', await sha256Hex(refreshToken))
    .maybeSingle();
  if (error) throw new ApiError('Could not verify refresh token.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!row || row.client_uuid !== client.id) throw invalidGrant();

  if (row.revoked_at) {
    // A rotated-then-replayed refresh token likely means theft: revoke the family.
    await admin
      .from('oauth_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('client_uuid', row.client_uuid)
      .eq('user_id', row.user_id)
      .is('revoked_at', null);
    throw invalidGrant('Refresh token has been revoked.');
  }
  if (!row.refresh_expires_at || new Date(row.refresh_expires_at) <= new Date()) throw invalidGrant();

  const { data: consumed, error: consumeError } = await admin
    .from('oauth_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('revoked_at', null)
    .select('id')
    .maybeSingle();
  if (consumeError) throw new ApiError('Could not rotate refresh token.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!consumed) throw invalidGrant();

  return issueTokens(admin, { clientUuid: row.client_uuid, userId: row.user_id, scope: row.scope });
}

/**
 * POST /api/oauth/token
 * Accepts JSON, form-encoded or HTTP Basic client credentials.
 * Grants: authorization_code, refresh_token.
 */
export const onRequest = oauthHandler(async ({ request, env }) => {
  const body = await readBody(request);
  const grantType = str(body.grant_type);
  if (!grantType) throw new ApiError('grant_type is required.', { status: 400, code: 'INVALID_REQUEST' });

  const { clientId } = clientAuth(request, body);
  if (!clientId) throw new ApiError('client_id is required.', { status: 401, code: 'INVALID_CLIENT' });

  const admin = serviceClient(env);
  const { data: client, error } = await admin
    .from('oauth_clients')
    .select('id, client_id, client_secret_hash, revoked_at')
    .eq('client_id', clientId)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) throw new ApiError('Could not load OAuth client.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!client) throw new ApiError('Unknown or revoked OAuth client.', { status: 401, code: 'INVALID_CLIENT' });

  if (grantType === 'authorization_code') {
    return oauthJson(await exchangeCode(admin, client, request, body));
  }
  if (grantType === 'refresh_token') {
    return oauthJson(await rotateRefreshToken(admin, client, request, body));
  }
  throw new ApiError('Unsupported grant_type.', { status: 400, code: 'UNSUPPORTED_GRANT_TYPE' });
}, { methods: ['POST'] });
