import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../ui/LazyImage.jsx';
import Icon from '../ui/Icon.jsx';
import Button from '../ui/Button.jsx';
import { HeroSkeleton } from '../ui/Skeleton.jsx';
import { ErrorState } from '../ui/StateView.jsx';
import { formatScore, mediaTitle, formatSeasonYear, FORMAT_LABELS } from '../../lib/format.js';
import { infoPath, playerPath } from '../../lib/slug.js';

const AUTOPLAY_MS = 7000;

export default function HeroSlider({ items, loading, error, onRetry }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef({ x: 0, y: 0 });
  const count = items?.length || 0;

  const go = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, next, count]);

  useEffect(() => {
    if (index >= count && count) setIndex(0);
  }, [count, index]);

  if (loading) return <HeroSkeleton />;
  if (error) return <div className="mx-auto max-w-7xl px-4 pt-8"><ErrorState onRetry={onRetry} title="Couldn't load trending anime" /></div>;
  if (!count) return null;

  const current = items[index];
  const title = mediaTitle(current);

  return (
    <section
      className="relative h-[62vh] min-h-[440px] w-full overflow-hidden md:h-[74vh] md:max-h-[760px]"
      aria-roledescription="carousel"
      aria-label="Trending anime"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touch.current.x;
        const dy = e.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {items.map((m, i) => (
        <div
          key={m.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          aria-hidden={i !== index}
        >
          <LazyImage
            src={m.bannerImage || m.coverImage?.extraLarge || m.coverImage?.large}
            alt=""
            priority={i === 0}
            className="h-full w-full"
            imgClassName="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-surface/5" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/40 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 md:justify-center md:pb-0 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-brand px-2.5 py-1 text-white shadow-lg shadow-brand/30"># Trending Now</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-zinc-200 backdrop-blur">
              <Icon name="star" size={12} fill className="text-amber-400" />
              {formatScore(current.averageScore)}
            </span>
            <span className="rounded-full bg-black/50 px-2.5 py-1 text-zinc-300 backdrop-blur">
              {FORMAT_LABELS[current.format] || current.format} · {formatSeasonYear(current.season, current.seasonYear)}
            </span>
          </div>

          <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow sm:text-5xl md:text-6xl">
            {title}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {(current.genres || []).slice(0, 4).map((g) => (
              <Link key={g} to={`/genre/${encodeURIComponent(g)}`} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-zinc-200 backdrop-blur hover:border-white/40 hover:text-white">
                {g}
              </Link>
            ))}
          </div>

          {current.description && (
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-zinc-300 md:text-base">
              {current.description.replace(/<[^>]*>/g, '')}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button to={playerPath(current, 1, 'sub')} size="lg" className="shadow-lg shadow-brand/30">
              <Icon name="play" size={18} fill />
              Watch Now
            </Button>
            <Button to={infoPath(current)} size="lg" variant="secondary">
              <Icon name="info" size={18} />
              Details
            </Button>
          </div>
        </div>
      </div>

      {count > 1 && (
        <>
          <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 md:grid">
            <Icon name="chevronLeft" size={22} />
          </button>
          <button type="button" onClick={next} aria-label="Next slide" className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/70 md:grid">
            <Icon name="chevronRight" size={22} />
          </button>
          <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2" role="tablist" aria-label="Slides">
            {items.map((m, i) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}: ${mediaTitle(m)}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-7 bg-brand' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
