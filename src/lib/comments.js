import { supabase } from './supabase/client.js';

const COLUMNS = 'id, user_id, anilist_id, episode, body, status, created_at, author_username, author_avatar_url, author_verified, author_role, author_banned';

function requireClient() {
  if (!supabase) throw new Error('Comments are not configured on this deployment.');
  return supabase;
}

function fail(error) {
  throw new Error(error?.message || 'Something went wrong. Please try again.');
}

function toComment(row) {
  return {
    id: row.id,
    userId: row.user_id,
    anilistId: row.anilist_id,
    episode: row.episode,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    username: row.author_username,
    avatarUrl: row.author_avatar_url,
    verified: Boolean(row.author_verified),
    role: row.author_role || 'user',
    banned: Boolean(row.author_banned),
  };
}

export async function listComments(anilistId, { episode = null, limit = 50 } = {}) {
  if (!supabase) return [];
  let query = supabase
    .from('comments')
    .select(COLUMNS)
    .eq('anilist_id', Number(anilistId))
    .order('created_at', { ascending: false })
    .limit(limit);
  query = episode == null ? query.is('episode', null) : query.eq('episode', Number(episode));
  const { data, error } = await query;
  if (error) fail(error);
  return data.map(toComment);
}

export async function addComment({ userId, anilistId, episode = null, body }) {
  const text = String(body || '').trim();
  if (!text) throw new Error('Write something before posting.');
  if (text.length > 2000) throw new Error('Comments are limited to 2000 characters.');
  const { data, error } = await requireClient()
    .from('comments')
    .insert({
      user_id: userId,
      anilist_id: Number(anilistId),
      episode: episode == null ? null : Number(episode),
      body: text,
    })
    .select(COLUMNS)
    .single();
  if (error) fail(error);
  return toComment(data);
}

export async function setCommentStatus(id, status) {
  const { error } = await requireClient().from('comments').update({ status }).eq('id', id);
  if (error) fail(error);
}

export async function deleteComment(id) {
  const { error } = await requireClient().from('comments').delete().eq('id', id);
  if (error) fail(error);
}
