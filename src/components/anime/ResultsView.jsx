import { useMemo } from 'react';
import { CardGrid } from './CardGrid.jsx';
import Pagination from './Pagination.jsx';

/** Shared result grid + pagination used by Browse, Genre and Search. */
export default function ResultsView({ data, loading, error, onRetry, emptyTitle, emptyDescription, onPageChange, footer }) {
  const items = data?.media || [];
  const info = data?.pageInfo;

  const total = useMemo(() => (info ? `Showing ${items.length} of ${info.total.toLocaleString()} titles` : null), [info, items.length]);

  return (
    <div>
      {total && !loading && !error && <p className="mb-3 text-xs text-zinc-500">{total}</p>}
      <CardGrid items={items} loading={loading} error={error} onRetry={onRetry} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
      {info && items.length > 0 && <Pagination page={info.currentPage} lastPage={info.lastPage} onChange={onPageChange} className="mt-8" />}
      {footer}
    </div>
  );
}
