import { supabase } from './supabase/client.js';

function requireClient() {
  if (!supabase) throw new Error('Accounts are not configured on this deployment.');
  return supabase;
}

function fail(error) {
  throw new Error(error?.message || 'Something went wrong. Please try again.');
}

/* ---------------- watchlist ---------------- */

export async function listWatchlist(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('watchlist')
    .select('anilist_id, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) fail(error);
  return data.map((r) => ({ anilistId: r.anilist_id, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export async function getWatchlistEntry(userId, anilistId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('watchlist')
    .select('anilist_id, status')
    .eq('user_id', userId)
    .eq('anilist_id', anilistId)
    .maybeSingle();
  if (error) fail(error);
  return data ? { anilistId: data.anilist_id, status: data.status } : null;
}

export async function setWatchlistStatus(userId, anilistId, status) {
  const { error } = await requireClient()
    .from('watchlist')
    .upsert({ user_id: userId, anilist_id: Number(anilistId), status }, { onConflict: 'user_id,anilist_id' });
  if (error) fail(error);
}

export async function removeWatchlistEntry(userId, anilistId) {
  const { error } = await requireClient().from('watchlist').delete().eq('user_id', userId).eq('anilist_id', Number(anilistId));
  if (error) fail(error);
}

/* ---------------- history ---------------- */

export async function listHistory(userId, { limit = 100 } = {}) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('history')
    .select('anilist_id, episode, progress_seconds, duration_seconds, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) fail(error);
  return data.map((r) => ({
    anilistId: r.anilist_id,
    episode: r.episode,
    progressSeconds: r.progress_seconds,
    durationSeconds: r.duration_seconds,
    updatedAt: r.updated_at,
  }));
}

export async function logEpisodeWatched(userId, anilistId, episode, { progressSeconds = 0, durationSeconds = null } = {}) {
  if (!supabase || !userId) return;
  const { error } = await supabase.from('history').upsert(
    {
      user_id: userId,
      anilist_id: Number(anilistId),
      episode: Number(episode),
      progress_seconds: progressSeconds,
      duration_seconds: durationSeconds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,anilist_id,episode' },
  );
  if (error) console.warn('[history] log failed:', error.message);
}

export async function removeHistoryEntry(userId, anilistId, episode) {
  const { error } = await requireClient()
    .from('history')
    .delete()
    .eq('user_id', userId)
    .eq('anilist_id', Number(anilistId))
    .eq('episode', Number(episode));
  if (error) fail(error);
}

/* ---------------- profile ---------------- */

export async function updateProfile(userId, patch) {
  const allowed = {};
  if (patch.username !== undefined) allowed.username = patch.username;
  if (patch.avatar_url !== undefined) allowed.avatar_url = patch.avatar_url || null;
  const { data, error } = await requireClient().from('profiles').update(allowed).eq('id', userId).select('id, username, avatar_url, role').single();
  if (error) fail(error);
  return data;
}
