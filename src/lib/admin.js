import { supabase } from './supabase/client.js';

/**
 * Admin panel data access.
 *
 * Uses the browser Supabase client created from VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY, so the panel works even when the Pages
 * Functions server has no Supabase secrets. RLS + the RPCs in
 * 20261114000300_moderation.sql enforce admin/moderator permissions.
 */

const OVERRIDE_COLUMNS = 'anilist_id, has_sub, has_dub, sub_episodes, dub_episodes, updated_at, updated_by';
const USER_COLUMNS = 'id, username, role, verified, banned';

function requireClient() {
  if (!supabase) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use the admin panel.');
  return supabase;
}

function fail(error) {
  throw new Error(error?.message || 'Something went wrong. Please try again.');
}

function toOverride(row) {
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

function toUser(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    verified: Boolean(row.verified) || row.role === 'admin',
    banned: Boolean(row.banned),
  };
}

function firstRow(data) {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('User not found.');
  return row;
}

async function countRows(client, table) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  if (error) fail(error);
  return count ?? 0;
}

export async function adminStats() {
  const client = requireClient();
  const [users, watchlistEntries, historyEntries, cacheOverrides] = await Promise.all([
    countRows(client, 'profiles'),
    countRows(client, 'watchlist'),
    countRows(client, 'history'),
    countRows(client, 'availability_overrides'),
  ]);
  // Cached shows live in the server KV namespace, which the browser can't count.
  return { users, watchlistEntries, historyEntries, cacheOverrides, cachedShows: null };
}

export async function adminListOverrides() {
  const { data, error } = await requireClient()
    .from('availability_overrides')
    .select(OVERRIDE_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(500);
  if (error) fail(error);
  return data.map(toOverride);
}

export async function adminSaveOverride(override, userId) {
  const nullable = (value) => (value == null || value === '' ? null : Number(value));
  const { data, error } = await requireClient()
    .from('availability_overrides')
    .upsert(
      {
        anilist_id: Number(override.anilistId),
        has_sub: Boolean(override.hasSub),
        has_dub: Boolean(override.hasDub),
        sub_episodes: nullable(override.subEpisodes),
        dub_episodes: nullable(override.dubEpisodes),
        updated_by: userId,
      },
      { onConflict: 'anilist_id' },
    )
    .select(OVERRIDE_COLUMNS)
    .single();
  if (error) fail(error);
  return toOverride(data);
}

export async function adminDeleteOverride(anilistId) {
  const { error } = await requireClient().from('availability_overrides').delete().eq('anilist_id', Number(anilistId));
  if (error) fail(error);
}

export async function adminSearchUsers(q) {
  const term = String(q || '').trim().replace(/[%_]/g, '');
  if (term.length < 2) return [];
  const { data, error } = await requireClient()
    .from('profiles')
    .select(USER_COLUMNS)
    .ilike('username', `%${term}%`)
    .order('username')
    .limit(20);
  if (error) fail(error);
  return data.map(toUser);
}

export async function adminSetVerified(userId, verified) {
  const { data, error } = await requireClient().rpc('admin_set_verified', {
    target_id: userId,
    make_verified: Boolean(verified),
  });
  if (error) fail(error);
  return toUser(firstRow(data));
}

export async function adminSetRole(userId, role) {
  const { data, error } = await requireClient().rpc('admin_set_role', {
    target_id: userId,
    new_role: role,
  });
  if (error) fail(error);
  return toUser(firstRow(data));
}

export async function setUserBanned(userId, banned) {
  const { data, error } = await requireClient().rpc('set_user_banned', {
    target_id: userId,
    make_banned: Boolean(banned),
  });
  if (error) fail(error);
  return toUser(firstRow(data));
}
