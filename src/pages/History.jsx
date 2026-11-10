import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import { listHistory, removeHistoryEntry } from '../lib/library.js';
import { formatTimeAgo, mediaTitle } from '../lib/format.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import LazyImage from '../components/ui/LazyImage.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui/StateView.jsx';

export default function History() {
  const { user, isDemoMode } = useAuth();
  const { error: toastError } = useToast();
  const [rows, setRows] = useState(null);
  const [mediaMap, setMediaMap] = useState({});
  const [error, setError] = useState(null);

  useDocumentMeta({ title: 'Continue watching', description: 'Pick up where you left off on Mr.Anime.' });

  const load = useCallback(async () => {
    setError(null);
    setRows(null);
    try {
      const list = await listHistory(user.id);
      setRows(list);
      const ids = [...new Set(list.map((r) => r.anilistId))];
      if (ids.length) {
        const res = await api.animeBatch(ids);
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

  const continueRows = useMemo(() => {
    if (!rows) return [];
    const latest = new Map();
    for (const r of rows) {
      if (!latest.has(r.anilistId)) latest.set(r.anilistId, r);
    }
    return [...latest.values()].slice(0, 8);
  }, [rows]);

  const remove = async (r) => {
    try {
      await removeHistoryEntry(user.id, r.anilistId, r.episode);
      setRows((prev) => prev.filter((x) => !(x.anilistId === r.anilistId && x.episode === r.episode)));
    } catch (err) {
      toastError(err.message);
    }
  };

  if (isDemoMode) {
    return (
      <Container className="py-10 md:py-14">
        <PageHeader title="Continue watching" />
        <EmptyState icon="clock" title="Your history lives here" description="Sign in with a configured Supabase project to track what you watch." action={<Button to="/browse">Browse anime</Button>} />
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title="Continue watching" description="Jump back into the episode you were on." />

      {error ? (
        <ErrorState title="Couldn't load your history" message={error.message} onRetry={load} />
      ) : rows === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon="clock" title="Nothing watched yet" description="Episodes you start will show up here so you can resume easily." action={<Button to="/browse">Browse anime</Button>} />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-lg font-bold text-white">Resume</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
              {continueRows.map((r) => {
                const m = mediaMap[r.anilistId];
                return (
                  <Link key={r.anilistId} to={`/watch/${r.anilistId}/${r.episode}`} className="group w-[190px] shrink-0 sm:w-[220px]">
                    <div className="relative overflow-hidden rounded-xl">
                      <LazyImage src={m?.bannerImage || m?.coverImage?.large} alt="" className="aspect-video w-full" imgClassName="group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">EP {r.episode}</span>
                      <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/90 text-white"><Icon name="play" size={16} fill /></span>
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-sm font-medium text-zinc-100 group-hover:text-white">{m ? mediaTitle(m) : `Anime #${r.anilistId}`}</p>
                    <p className="text-xs text-zinc-500">{formatTimeAgo(Math.floor(new Date(r.updatedAt).getTime() / 1000))}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-white">All history</h2>
            <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-surface-2/50">
              {rows.map((r) => {
                const m = mediaMap[r.anilistId];
                return (
                  <li key={`${r.anilistId}-${r.episode}`} className="flex items-center gap-3 p-3">
                    <LazyImage src={m?.coverImage?.large} alt="" className="h-14 w-10 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/anime/${r.anilistId}`} className="line-clamp-1 text-sm font-medium text-zinc-100 hover:text-brand">
                        {m ? mediaTitle(m) : `Anime #${r.anilistId}`}
                      </Link>
                      <p className="text-xs text-zinc-500">Episode {r.episode} · {formatTimeAgo(Math.floor(new Date(r.updatedAt).getTime() / 1000))}</p>
                    </div>
                    <Button to={`/watch/${r.anilistId}/${r.episode}`} size="sm" variant="secondary">Continue</Button>
                    <button type="button" onClick={() => remove(r)} aria-label="Remove from history" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-brand/15 hover:text-brand">
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </Container>
  );
}
