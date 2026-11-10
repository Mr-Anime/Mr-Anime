import { Link } from 'react-router-dom';
import LazyImage from '../../ui/LazyImage.jsx';
import Icon from '../../ui/Icon.jsx';
import Button from '../../ui/Button.jsx';
import { formatCount, formatDuration, formatScore, formatSeasonYear, mediaTitle, STATUS_LABELS, FORMAT_LABELS } from '../../../lib/format.js';

const STATUS_DOT = {
  RELEASING: 'bg-emerald-400',
  FINISHED: 'bg-sky-400',
  NOT_YET_RELEASED: 'bg-amber-400',
  CANCELLED: 'bg-zinc-500',
  HIATUS: 'bg-orange-400',
};

export default function DetailsHero({ media, availability, children }) {
  const title = mediaTitle(media);
  const episodes = media.episodes || 0;
  const studios = media.studios?.nodes?.map((s) => s.name).join(', ');
  const trailerUrl = media.trailer?.site === 'youtube' && media.trailer.id ? `https://www.youtube.com/watch?v=${media.trailer.id}` : null;
  const canWatch = availability ? availability.hasSub || availability.hasDub : true;

  return (
    <div className="relative">
      <div className="relative h-[280px] w-full overflow-hidden sm:h-[360px] md:h-[420px]">
        <LazyImage src={media.bannerImage || media.coverImage?.extraLarge} alt="" priority className="h-full w-full" imgClassName="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/70 to-surface/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/70 to-transparent" />
      </div>

      <div className="mx-auto -mt-36 max-w-7xl px-4 sm:-mt-44 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:gap-7">
          <LazyImage
            src={media.coverImage?.extraLarge || media.coverImage?.large}
            alt={title}
            priority
            className="mx-auto aspect-[2/3] w-36 shrink-0 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:mx-0 sm:w-44 md:w-52"
            fallbackLabel={title}
          />

          <div className="min-w-0 flex-1 pb-2 sm:pt-24 md:pt-32">
            <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">{title}</h1>
            {media.title?.romaji && media.title.romaji !== title && <p className="mt-1 text-sm text-zinc-400">{media.title.romaji}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {media.averageScore != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-1 font-semibold text-amber-300">
                  <Icon name="star" size={13} fill />
                  {formatScore(media.averageScore)}
                </span>
              )}
              {media.status && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[media.status] || 'bg-zinc-500'}`} />
                  {STATUS_LABELS[media.status] || media.status}
                </span>
              )}
              {media.format && <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">{FORMAT_LABELS[media.format] || media.format}</span>}
              {episodes > 0 && <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">{episodes} eps</span>}
              {media.duration > 0 && <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">{formatDuration(media.duration)}</span>}
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-zinc-300">{formatSeasonYear(media.season, media.seasonYear)}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(media.genres || []).map((g) => (
                <Link key={g} to={`/genre/${encodeURIComponent(g)}`} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-200 transition-colors hover:border-brand/60 hover:text-white">
                  {g}
                </Link>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Button to={`/watch/${media.id}/1`} size="lg" disabled={!canWatch} className="shadow-lg shadow-brand/20">
                <Icon name="play" size={18} fill />
                Watch now
              </Button>
              {children}
              {trailerUrl && (
                <Button as="a" href={trailerUrl} target="_blank" rel="noopener noreferrer" size="lg" variant="ghost">
                  <Icon name="external" size={16} />
                  Trailer
                </Button>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-4">
              <Meta label="Popularity" value={formatCount(media.popularity)} />
              <Meta label="Favourites" value={formatCount(media.favourites)} />
              <Meta label="Studio" value={studios || '—'} />
              <Meta label="Source" value={media.source ? titleCase(media.source) : '—'} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-200">{value}</dd>
    </div>
  );
}

function titleCase(s) {
  return s.toLowerCase().split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
