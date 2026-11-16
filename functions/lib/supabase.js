import './runtime.js';
import { createClient } from '@supabase/supabase-js';
import { ApiError } from './http.js';

/**
 * Accept the build-time VITE_ names as a fallback: Pages exposes every
 * dashboard variable to Functions, and deployments have historically set
 * VITE_SUPABASE_* only.
 */
function supabaseUrl(env) {
  return env.SUPABASE_URL || env.VITE_SUPABASE_URL;
}

function anonKey(env) {
  return env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
}

/** Service-role client for server-side reads/writes. Never expose its results raw. */
export function serviceClient(env) {
  const url = supabaseUrl(env);
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new ApiError('Supabase is not configured on the server.', { status: 503, code: 'INTERNAL' });
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Verify the caller's Supabase session and return the auth user.
 */
export async function requireUser(request, env) {
  const token = bearerToken(request);
  if (!token) throw new ApiError('Sign in required.', { status: 401, code: 'UNAUTHORIZED' });

  const url = supabaseUrl(env);
  const anon = anonKey(env);
  if (!url || !anon) throw new ApiError('Supabase is not configured on the server.', { status: 503, code: 'INTERNAL' });

  const authClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) throw new ApiError('Invalid or expired session.', { status: 401, code: 'UNAUTHORIZED' });
  return { user: data.user };
}

/**
 * Verify the caller via the anon-key auth client, then require role=admin
 * from the profiles table. Returns { user, profile, admin }.
 */
export async function requireAdmin(request, env) {
  const { user } = await requireUser(request, env);

  const admin = serviceClient(env);
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, username, role, verified')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) throw new ApiError('Could not verify your account.', { status: 502, code: 'UPSTREAM_ERROR' });
  if (profile?.role !== 'admin') throw new ApiError('Admin access required.', { status: 403, code: 'FORBIDDEN' });

  return { user, profile, admin };
}

export async function countRows(client, table) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new ApiError(`Could not count ${table}.`, { status: 502, code: 'UPSTREAM_ERROR' });
  return count ?? 0;
}
