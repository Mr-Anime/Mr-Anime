import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';

/** Prev / page numbers / next. `page` is 1-based. */
export default function Pagination({ page = 1, lastPage = 1, onChange, className = '' }) {
  if (!lastPage || lastPage <= 1) return null;

  const pages = pageWindow(page, lastPage);

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`} aria-label="Pagination">
      <Button variant="secondary" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <Icon name="chevronLeft" size={16} />
        Prev
      </Button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-2 text-sm text-zinc-500">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`h-8 min-w-8 rounded-lg px-2.5 text-sm font-medium transition-colors ${
              p === page ? 'bg-brand text-white' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <Button variant="secondary" size="sm" onClick={() => onChange(page + 1)} disabled={page >= lastPage} aria-label="Next page">
        Next
        <Icon name="chevronRight" size={16} />
      </Button>
    </nav>
  );
}

function pageWindow(current, last) {
  const out = [];
  const add = (v) => out.push(v);
  const span = 1;
  const from = Math.max(2, current - span);
  const to = Math.min(last - 1, current + span);
  add(1);
  if (from > 2) add('…');
  for (let p = from; p <= to; p++) add(p);
  if (to < last - 1) add('…');
  if (last > 1) add(last);
  return out;
}
