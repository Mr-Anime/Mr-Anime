import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useToast } from '../../../context/ToastContext.jsx';
import { getWatchlistEntry, removeWatchlistEntry, setWatchlistStatus } from '../../../lib/library.js';
import { LIST_STATUSES } from '../../../lib/format.js';
import Button from '../../ui/Button.jsx';
import Icon from '../../ui/Icon.jsx';

export default function WatchlistButton({ anilistId }) {
  const { user, isDemoMode } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setStatus(null);
      return;
    }
    getWatchlistEntry(user.id, anilistId)
      .then((entry) => active && setStatus(entry?.status || null))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id, anilistId]);

  const change = useCallback(
    async (next) => {
      if (!user) {
        navigate('/login', { state: { from: `/anime/${anilistId}` } });
        return;
      }
      if (isDemoMode) {
        toastError('Connect Supabase to save your watchlist.');
        return;
      }
      setBusy(true);
      try {
        if (!next) {
          await removeWatchlistEntry(user.id, anilistId);
          setStatus(null);
          success('Removed from watchlist.');
        } else {
          await setWatchlistStatus(user.id, anilistId, next);
          setStatus(next);
          success(`Saved as “${LIST_STATUSES.find((s) => s.value === next)?.label}”.`);
        }
      } catch (err) {
        toastError(err.message);
      } finally {
        setBusy(false);
      }
    },
    [user, isDemoMode, anilistId, success, toastError, navigate],
  );

  return (
    <div className="flex items-center gap-2">
      <Button
        size="lg"
        variant={status ? 'primary' : 'outline'}
        loading={busy}
        onClick={() => change(status ? null : 'planning')}
        aria-pressed={Boolean(status)}
      >
        <Icon name="bookmark" size={18} fill={Boolean(status)} />
        {status ? LIST_STATUSES.find((s) => s.value === status)?.label : 'Add to watchlist'}
      </Button>
      <label className="sr-only" htmlFor="watchlist-status">Watch status</label>
      <select
        id="watchlist-status"
        value={status || ''}
        disabled={busy}
        onChange={(e) => change(e.target.value || null)}
        className="h-12 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-zinc-200 focus:border-brand/60 focus:outline-none"
      >
        <option value="">Status…</option>
        {LIST_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
