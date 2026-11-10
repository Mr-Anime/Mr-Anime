import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import { listWatchlist, removeWatchlistEntry, setWatchlistStatus } from '../lib/library.js';
import { LIST_STATUSES } from '../lib/format.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import { CardGridSkeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui/StateView.jsx';
import WatchlistCard from '../components/library/WatchlistCard.jsx';

const GRID = 'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

export default function Watchlist() {
  const { user, isDemoMode } = useAuth();
  const { success, error: toastError } = useToast();
  const [rows, setRows] = useState(null);
  const [mediaMap, setMediaMap] = useState({});
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('all');
  const [busyId, setBusyId] = useState(null);

  useDocumentMeta({ title: 'My watchlist', description: 'Everything you plan to watch, are watching, or have finished.' });

  const load = useCallback(async () => {
    setError(null);
    setRows(null);
    try {
      const list = await listWatchlist(user.id);
      setRows(list);
      if (list.length) {
        const res = await api.animeBatch(list.map((r) => r.anilistId));
        const map = {};
        for (const card of res.data || []) map[card.id] = card;
        setMediaMap(map);
      }
    } catch (err) {
      setError(err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && !isDemoMode) load();
  }, [user?.id, isDemoMode, load]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (tab === 'all') return rows;
    return rows.filter((r) => r.status === tab);
  }, [rows, tab]);

  const counts = useMemo(() => {
    const c = { all: rows?.length || 0 };
    for (const s of LIST_STATUSES) c[s.value] = rows?.filter((r) => r.status === s.value).length || 0;
    return c;
  }, [rows]);

  const changeStatus = async (anilistId, status) => {
    setBusyId(anilistId);
    try {
      await setWatchlistStatus(user.id, anilistId, status);
      setRows((prev) => prev.map((r) => (r.anilistId === anilistId ? { ...r, status } : r)));
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (anilistId) => {
    setBusyId(anilistId);
    try {
      await removeWatchlistEntry(user.id, anilistId);
      setRows((prev) => prev.filter((r) => r.anilistId !== anilistId));
      success('Removed from watchlist.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (isDemoMode) {
    return (
      <Container className="py-10 md:py-14">
        <PageHeader title="My watchlist" description="Save what you want to watch and track your progress." />
        <EmptyState
          icon="bookmark"
          title="Sign in to sync your watchlist"
          description="Accounts are not configured on this build, so watchlist entries cannot be saved yet."
          action={<Button to="/browse">Browse anime</Button>}
        />
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title="My watchlist" description="Save what you want to watch and track your progress." />

      <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto pb-1">
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>All <span className="text-zinc-500">{counts.all}</span></TabButton>
        {LIST_STATUSES.map((s) => (
          <TabButton key={s.value} active={tab === s.value} onClick={() => setTab(s.value)}>
            {s.label} <span className="text-zinc-500">{counts[s.value]}</span>
          </TabButton>
        ))}
      </div>

      {error ? (
        <ErrorState title="Couldn't load your watchlist" message={error.message} onRetry={load} />
      ) : rows === null ? (
        <CardGridSkeleton count={12} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title={tab === 'all' ? 'Your watchlist is empty' : `Nothing marked as ${tab}`}
          description="Find something to watch and add it here."
          action={<Button to="/browse">Browse anime</Button>}
        />
      ) : (
        <div className={GRID}>
          {filtered.map((r) => (
            <WatchlistCard
              key={r.anilistId}
              media={mediaMap[r.anilistId] || { id: r.anilistId, title: { english: `Anime #${r.anilistId}` }, coverImage: {} }}
              status={r.status}
              busy={busyId === r.anilistId}
              onStatusChange={(s) => changeStatus(r.anilistId, s)}
              onRemove={() => remove(r.anilistId)}
            />
          ))}
        </div>
      )}
    </Container>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
        active ? 'bg-brand text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
