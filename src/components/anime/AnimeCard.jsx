import { Link } from 'react-router-dom';
import LazyImage from '../ui/LazyImage.jsx';
import Icon from '../ui/Icon.jsx';
import { SubBadge, DubBadge, EpisodeBadge, ScoreBadge, formatLabel } from './Badges.jsx';
import { getEpisodeCount, mediaTitle, STATUS_LABELS } from '../../lib/format.js';
import { infoPath } from '../../lib/slug.js';

/**
 * Card used across Home rows, grids and recommendations.
 * Availability defaults to SUB+DUB until /api/availability resolves (anime_cache
 * will supply real data); pass `availability` to override the badges.
 */
export default function AnimeCard({ media, availability, className = '', priority = false }) {
  if (!media) return null;
  const title = mediaTitle(media);
  const episodes = getEpisodeCount(media);
  const showSub = availability ? availability.hasSub : true;
  const showDub = availability ? availability.hasDub : true;

  return (
    <Link
      to={infoPath(media)}
      className={`group relative block outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-brand rounded-xl ${className}`}
      aria-label={`${title}${media.format ? `, ${media.format}` : ''}`}
    >
      <div className="relative overflow-hidden rounded-xl bg-surface-3 shadow-lg shadow-black/30 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/50">
        <LazyImage
          src={media.coverImage?.large || media.coverImage?.extraLarge}
          alt={title}
          priority={priority}
          className="aspect-[2/3] w-full"
          imgClassName="group-hover:scale-105 transition-transform duration-500"
          fallbackLabel={title}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {showSub && <SubBadge />}
          {showDub && <DubBadge />}
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {episodes > 0 && <EpisodeBadge count={episodes} />}
          {media.status === 'RELEASING' && (
            <span className="rounded bg-brand/90 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">AIRING</span>
          )}
        </div>

        <DesktopPopover media={media} title={title} />
      </div>

      <div className="mt-2 px-0.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100 group-hover:text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500">{formatLabel(media.format, media.seasonYear)}</p>
      </div>
    </Link>
  );
}

function DesktopPopover({ media, title }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-full z-30 hidden translate-y-1 rounded-xl border border-white/10 bg-surface-2/98 p-3 opacity-0 shadow-2xl shadow-black/60 backdrop-blur-md transition-all duration-200 group-hover:translate-y-2 group-hover:opacity-100 md:block"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-2">
        <ScoreBadge score={media.averageScore} />
        <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
          <span className={`h-1.5 w-1.5 rounded-full ${media.status === 'RELEASING' ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
          {STATUS_LABELS[media.status] || media.status}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {(media.genres || []).slice(0, 3).map((g) => (
          <span key={g} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300">{g}</span>
        ))}
      </div>
      {media.description && (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-400">
          {media.description.replace(/<[^>]*>/g, '')}
        </p>
      )}
      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand">
        View details <Icon name="arrowRight" size={12} />
      </p>
    </div>
  );
}
