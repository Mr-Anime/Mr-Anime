import AnimeCard from './AnimeCard.jsx';
import { CardGridSkeleton } from '../ui/Skeleton.jsx';
import { EmptyState, ErrorState } from '../ui/StateView.jsx';

const GRID = 'grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 md:gap-x-4 lg:grid-cols-6 xl:grid-cols-7';

export function CardGrid({ items, loading, error, onRetry, emptyTitle = 'Nothing found', emptyDescription, footer }) {
  if (loading && !items?.length) return <CardGridSkeleton />;
  if (error && !items?.length) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (!items?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      <div className={GRID}>
        {items.map((m, i) => (
          <AnimeCard key={m.id ?? i} media={m} priority={i < 6} />
        ))}
      </div>
      {footer}
    </>
  );
}
