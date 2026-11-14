import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminSearchUsers, adminSetRole, adminSetVerified } from '../../lib/admin.js';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import VerifiedBadge from '../ui/VerifiedBadge.jsx';

/** Search users and manage their verified badge and role (admins are always verified). */
export default function UserBadges() {
  const { user: me } = useAuth();
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
      adminSearchUsers(query)
        .then((list) => active && setRows(list))
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
      const updated = await adminSetVerified(row.id, !row.verified);
      setRows((list) => list.map((r) => (r.id === row.id ? updated : r)));
      success(updated.verified ? `Verified ${row.username}.` : `Removed the badge from ${row.username}.`);
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = async (row, role) => {
    if (role === row.role) return;
    setBusyId(row.id);
    try {
      const updated = await adminSetRole(row.id, role);
      setRows((list) => list.map((r) => (r.id === row.id ? updated : r)));
      success(`${row.username || 'User'} is now ${role}.`);
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
      <p className="mt-1.5 text-xs text-zinc-500">
        Verified badges and roles appear next to names in comments. Admins are always verified; moderators can hide, delete and ban comments.
      </p>

      {loading && <p className="mt-3 text-sm text-zinc-500">Searching…</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {!loading && !error && q.trim().length >= 2 && rows.length === 0 && (
        <p className="mt-3 text-sm text-zinc-500">No users match “{q.trim()}”.</p>
      )}

      {rows.length > 0 && (
        <ul className="mt-3 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-surface-2/50">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-sm text-zinc-200">
                <span className="truncate font-medium">{row.username || 'Unnamed user'}</span>
                {row.verified && <VerifiedBadge size={15} />}
                {row.role === 'admin' && <RoleChip tone="admin">Admin</RoleChip>}
                {row.role === 'moderator' && <RoleChip tone="moderator">Moderator</RoleChip>}
                {row.banned && <RoleChip tone="banned">Banned</RoleChip>}
              </span>

              <select
                value={row.role}
                disabled={busyId === row.id || row.id === me?.id}
                onChange={(e) => changeRole(row, e.target.value)}
                aria-label={`Role for ${row.username || 'user'}`}
                className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:border-brand/60 focus:outline-none disabled:opacity-50"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>

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

function RoleChip({ tone, children }) {
  const tones = {
    admin: 'bg-brand/15 text-brand',
    moderator: 'bg-sky-400/15 text-sky-300',
    banned: 'bg-red-500/15 text-red-300',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
