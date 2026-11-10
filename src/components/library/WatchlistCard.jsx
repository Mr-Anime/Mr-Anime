import { Link } from 'react-router-dom';
import LazyImage from '../ui/LazyImage.jsx';
import Icon from '../ui/Icon.jsx';
import { formatLabel } from '../anime/Badges.jsx';
import { LIST_STATUSES, mediaTitle } from '../../lib/format.js';

export default function WatchlistCard({ media, status, busy, onStatusChange, onRemove }) {
  if (!media) return null;
  const title = mediaTitle(media);

  return (
    <div className="group relative">
      <Link to={`/anime/${media.id}`} className="block rounded-xl focus-visible:ring-2 focus-visible:ring-brand">
        <LazyImage src={media.coverImage?.large} alt={title} className="aspect-[2/3] w-full rounded-xl" imgClassName="group-hover:scale-105 transition-transform duration-300" fallbackLabel={title} />
      </Link>
      <div className="mt-2">
        <Link to={`/anime/${media.id}`} className="line-clamp-2 text-sm font-medium text-zinc-100 hover:text-white">{title}</Link>
        <p className="mt-0.5 text-xs text-zinc-500">{formatLabel(media.format, media.seasonYear)}</p>
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        <select
          value={status}
          disabled={busy}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label={`Status for ${title}`}
          className="h-7 min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-1.5 text-[11px] text-zinc-300 focus:border-brand/60 focus:outline-none"
        >
          {LIST_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          disabled={busy}
          aria-label={`Remove ${title} from watchlist`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-500 transition-colors hover:bg-brand/15 hover:text-brand"
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}
