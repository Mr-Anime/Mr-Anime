import { ApiError } from '../../lib/http.js';
import {
  CODE_TTL_SECONDS,
  oauthHandler,
  oauthJson,
  parseScope,
  randomToken,
  readBody,
  sha256Hex,
  validPkceChallenge,
} from '../../lib/oauth.js';
import { requireUser, serviceClient } from '../../lib/supabase.js';

function str(value) {
  return typeof value === 'string' ? value : '';
}

async function resolveClient(env, params) {
  const clientId = str(params.client_id);
  const redirectUri = str(params.redirect_uri);
  const responseType = str(params.response_type);
  const requestState = str(params.state);
  const challenge = str(params.code_challenge) || null;
  const method = str(params.code_challenge_method) || null;

  if (!clientId) throw new ApiError('client_id is required.', { status: 400, code: 'INVALID_REQUEST' });
  if (!redirectUri) throw new ApiError('redirect_uri is required.', { status: 400, code: 'INVALID_REQUEST' });
  if (responseType !== 'code') {
    throw new ApiError('response_type must be "code".', { status: 400, code: 'UNSUPPORTED_RESPONSE_TYPE' });
  }
  const scope = parseScope(params.scope);
  if (!scope) throw new ApiError('Unsupported scope.', { status: 400, code: 'INVALID_SCOPE' });
  if (challenge) {
    if (method !== 'S256' || !validPkceChallenge(challenge)) {
      throw new ApiError('code_challenge must be a valid S256 challenge.', { status: 400, code: 'INVALID_REQUEST' });
    }
  } else if (method) {
    throw new ApiError('code_challenge is required when code_challenge_method is set.', {
      status: 400,
      code: 'INVALID_REQUEST',
    });
  }

  const admin = serviceClient(env);
  const { data: client, error } = await admin
    .from('oauth_clients')
    .select('id, name, client_id, redirect_uris, revoked_at')
    .eq('client_id', clientId)
    .is('revoked_at', null)
    .maybeSingle();
  if (error) throw new ApiError('Could not load OAuth app.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (!client) throw new ApiError('Unknown or revoked OAuth client.', { status: 400, code: 'INVALID_CLIENT' });

  const uris = Array.isArray(client.redirect_uris) ? client.redirect_uris : [];
  if (!uris.includes(redirectUri)) {
    throw new ApiError('redirect_uri does not match a registered URI.', { status: 400, code: 'INVALID_REQUEST' });
  }

  return { admin, client, clientId, redirectUri, scope, state: requestState, challenge, method };
}

/**
 * GET  /api/oauth/authorize  validate params and describe the app (public)
 * POST /api/oauth/authorize  issue a single-use authorization code (signed in)
 */
export const onRequest = oauthHandler(async ({ request, env }) => {
  if (request.method === 'GET') {
    const params = Object.fromEntries(new URL(request.url).searchParams.entries());
    const resolved = await resolveClient(env, params);
    return oauthJson({
      data: {
        appName: resolved.client.name,
        clientId: resolved.client.client_id,
        redirectUri: resolved.redirectUri,
        scope: resolved.scope,
        state: resolved.state,
      },
    });
  }

  const { user } = await requireUser(request, env);
  const body = await readBody(request);
  const resolved = await resolveClient(env, {
    client_id: body.clientId ?? body.client_id,
    redirect_uri: body.redirectUri ?? body.redirect_uri,
    response_type: body.responseType ?? body.response_type,
    scope: body.scope,
    state: body.state,
    code_challenge: body.codeChallenge ?? body.code_challenge,
    code_challenge_method: body.codeChallengeMethod ?? body.code_challenge_method,
  });

  const code = randomToken('mra_code_');
  const codeHash = await sha256Hex(code);
  const { error } = await resolved.admin.from('oauth_authorization_codes').insert({
    code_hash: codeHash,
    client_uuid: resolved.client.id,
    user_id: user.id,
    redirect_uri: resolved.redirectUri,
    scope: resolved.scope,
    code_challenge: resolved.challenge,
    code_challenge_method: resolved.method,
    expires_at: new Date(Date.now() + CODE_TTL_SECONDS * 1000).toISOString(),
  });
  if (error) throw new ApiError('Could not create authorization code.', { status: 502, code: 'UPSTREAM_ERROR' });

  const redirectTo = new URL(resolved.redirectUri);
  redirectTo.searchParams.set('code', code);
  if (resolved.state) redirectTo.searchParams.set('state', resolved.state);

  return oauthJson({ data: { redirectTo: redirectTo.toString() } });
}, { methods: ['GET', 'POST'] });
