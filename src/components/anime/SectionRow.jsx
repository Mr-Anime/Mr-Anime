import { useRef } from 'react';
import { Link } from 'react-router-dom';
import AnimeCard from './AnimeCard.jsx';
import Icon from '../ui/Icon.jsx';
import { RowSkeleton } from '../ui/Skeleton.jsx';
import { ErrorState } from '../ui/StateView.jsx';

export function SectionHeader({ title, subtitle, viewAllHref }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link to={viewAllHref} className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-400 transition-colors hover:text-brand">
          View all
          <Icon name="arrowRight" size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default function SectionRow({ title, subtitle, viewAllHref, items, loading, error, onRetry, getAvailability }) {
  const scroller = useRef(null);
  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <section className="relative">
      <SectionHeader title={title} subtitle={subtitle} viewAllHref={viewAllHref} />
      {loading ? (
        <RowSkeleton />
      ) : error ? (
        <ErrorState className="py-8" onRetry={onRetry} />
      ) : (
        <div className="group/row relative">
          <div ref={scroller} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0">
            {items?.map((m) => (
              <div key={m.id} className="w-[130px] shrink-0 snap-start sm:w-[150px] md:w-[168px]">
                <AnimeCard media={m} availability={getAvailability?.(m.id)} />
              </div>
            ))}
          </div>
          <RowArrow dir={-1} onClick={() => scrollBy(-1)} />
          <RowArrow dir={1} onClick={() => scrollBy(1)} />
        </div>
      )}
    </section>
  );
}

function RowArrow({ dir, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? 'Scroll left' : 'Scroll right'}
      className={`absolute top-1/3 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/70 text-white opacity-0 backdrop-blur transition-opacity hover:bg-black/90 group-hover/row:opacity-100 md:grid ${
        dir < 0 ? '-left-3' : '-right-3'
      }`}
    >
      <Icon name={dir < 0 ? 'chevronLeft' : 'chevronRight'} size={18} />
    </button>
  );
}
