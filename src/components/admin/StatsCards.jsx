import Icon from '../ui/Icon.jsx';

const CARDS = [
  { key: 'users', label: 'Users', icon: 'user', tone: 'text-sky-300 bg-sky-400/10' },
  { key: 'watchlistEntries', label: 'Watchlist entries', icon: 'bookmark', tone: 'text-brand bg-brand/10' },
  { key: 'historyEntries', label: 'History entries', icon: 'clock', tone: 'text-emerald-300 bg-emerald-400/10' },
  { key: 'cachedShows', label: 'Cached shows', icon: 'database', tone: 'text-accent bg-accent/10' },
  { key: 'cacheOverrides', label: 'Overrides', icon: 'settings', tone: 'text-amber-300 bg-amber-400/10' },
];

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {CARDS.map((c) => (
        <div key={c.key} className="rounded-2xl border border-white/5 bg-surface-2/60 p-4">
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${c.tone}`}>
            <Icon name={c.icon} size={17} />
          </span>
          <p className="mt-3 text-2xl font-extrabold text-white">{stats?.[c.key] != null ? Number(stats[c.key]).toLocaleString() : '—'}</p>
          <p className="text-xs text-zinc-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
