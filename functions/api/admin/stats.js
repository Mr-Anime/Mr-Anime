import { handle } from '../../lib/http.js';
import { countRows, requireAdmin } from '../../lib/supabase.js';
import { countKeys } from '../../lib/cache.js';

export const onRequest = handle(async ({ request, env }) => {
  const { admin } = await requireAdmin(request, env);

  const [users, watchlistEntries, historyEntries, cacheOverrides, cachedShows] = await Promise.all([
    countRows(admin, 'profiles'),
    countRows(admin, 'watchlist'),
    countRows(admin, 'history'),
    countRows(admin, 'availability_overrides'),
    countKeys(env, ''),
  ]);

  return { users, watchlistEntries, historyEntries, cachedShows, cacheOverrides };
}, { methods: ['GET'] });
