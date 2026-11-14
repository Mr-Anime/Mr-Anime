import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import VerifiedBadge from '../ui/VerifiedBadge.jsx';

/** Search users and toggle their verified badge (admins are always verified). */
export default function UserBadges() {
  const { success, error: toastError } = useToast();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setRows([]);
      setError(null);
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      api
        .adminUsers(query)
        .then((res) => active && setRows(res.data || []))
        .catch((err) => active && setError(err.message))
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [q]);

  const toggle = async (row) => {
    setBusyId(row.id);
    try {
      const res = await api.setUserVerified(row.id, !row.verified);
      setRows((list) => list.map((r) => (r.id === row.id ? res.data : r)));
      success(res.data.verified ? `Verified ${row.username}.` : `Removed the badge from ${row.username}.`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search username…"
        aria-label="Search users"
        className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-brand/60 focus:outline-none sm:max-w-sm"
      />
      <p className="mt-1.5 text-xs text-zinc-500">Verified users show a badge on their profile and comments. Admins are always verified.</p>

      {loading && <p className="mt-3 text-sm text-zinc-500">Searching…</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {!loading && !error && q.trim().length >= 2 && rows.length === 0 && (
        <p className="mt-3 text-sm text-zinc-500">No users match “{q.trim()}”.</p>
      )}

      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-surface-2/50">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 p-3">
              <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-sm text-zinc-200">
                <span className="truncate font-medium">{row.username || 'Unnamed user'}</span>
                {row.verified && <VerifiedBadge size={15} />}
                {row.role === 'admin' && <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">Admin</span>}
              </span>
              {row.role === 'admin' ? (
                <span className="text-xs text-zinc-500">Always verified</span>
              ) : (
                <Button size="sm" variant={row.verified ? 'secondary' : 'primary'} loading={busyId === row.id} onClick={() => toggle(row)}>
                  <Icon name={row.verified ? 'close' : 'check'} size={14} />
                  {row.verified ? 'Remove badge' : 'Verify'}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
