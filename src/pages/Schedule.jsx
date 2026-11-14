import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useDocumentMeta } from '../lib/meta.js';
import { formatCountdown, mediaTitle, FORMAT_LABELS } from '../lib/format.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import LazyImage from '../components/ui/LazyImage.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui/StateView.jsx';
import { infoPath, playerPath } from '../lib/slug.js';

const DAY_MS = 86400000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Schedule() {
  const query = useApi(useCallback((opts) => api.schedule({}, opts), []));
  const [now, setNow] = useState(Date.now);
  const [selected, setSelected] = useState(dayKey(new Date()));

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useDocumentMeta({ title: 'Airing schedule', description: 'See what anime airs today and this week on Mr.Anime.' });

  const days = useMemo(() => {
    const base = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getTime() + i * DAY_MS);
      return { key: dayKey(d), date: d, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : WEEKDAYS[d.getDay()], dayNum: d.getDate() };
    });
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const slot of query.data?.airingSchedules || []) {
      const key = dayKey(new Date(slot.airingAt * 1000));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(slot);
    }
    for (const list of map.values()) list.sort((a, b) => a.airingAt - b.airingAt);
    return map;
  }, [query.data]);

  const slots = grouped.get(selected) || [];

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title="Airing schedule" description="Episode releases this week, grouped by your local time." />

      <div className="no-scrollbar -mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {days.map((d) => {
          const active = d.key === selected;
          const count = grouped.get(d.key)?.length || 0;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setSelected(d.key)}
              aria-pressed={active}
              className={`flex w-[76px] shrink-0 flex-col items-center rounded-xl border px-2 py-2.5 transition-colors ${
                active ? 'border-brand bg-brand/15 text-white' : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/25'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wide text-zinc-400">{d.label}</span>
              <span className="mt-0.5 text-lg font-bold">{d.dayNum}</span>
              <span className={`mt-0.5 text-[10px] ${active ? 'text-brand' : 'text-zinc-500'}`}>{count} airing</span>
            </button>
          );
        })}
      </div>

      {query.loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : query.error ? (
        <ErrorState title="Couldn't load the schedule" message={query.error.message} onRetry={query.retry} />
      ) : slots.length === 0 ? (
        <EmptyState icon="calendar" title="Nothing airing this day" description="Pick another day to see scheduled episodes." />
      ) : (
        <ul className="space-y-2">
          {slots.map((slot) => (
            <ScheduleRow key={`${slot.media.id}-${slot.episode}`} slot={slot} now={now} />
          ))}
        </ul>
      )}
    </Container>
  );
}

function ScheduleRow({ slot, now }) {
  const { media, episode, airingAt } = slot;
  const airTime = new Date(airingAt * 1000);
  const time = airTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msLeft = airingAt * 1000 - now;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-2/60 p-2.5 transition-colors hover:border-white/15 sm:gap-4 sm:p-3">
      <div className="w-14 shrink-0 text-center sm:w-16">
        <p className="text-sm font-semibold text-white">{time}</p>
        <p className={`mt-0.5 text-[10px] ${msLeft > 0 ? 'text-zinc-500' : 'text-emerald-400'}`}>{formatCountdown(msLeft)}</p>
      </div>
      <Link to={infoPath(media)} className="flex min-w-0 flex-1 items-center gap-3 group">
        <LazyImage src={media.coverImage?.large} alt={mediaTitle(media)} className="h-[68px] w-12 shrink-0 rounded-lg" fallbackLabel={mediaTitle(media)} />
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-white group-hover:text-brand">{mediaTitle(media)}</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Episode {episode}
            {FORMAT_LABELS[media.format] ? ` · ${FORMAT_LABELS[media.format]}` : ''}
          </p>
        </div>
      </Link>
      <Button to={playerPath(media, episode, 'sub')} size="sm" variant="secondary" className="shrink-0">
        Watch
      </Button>
    </li>
  );
}
