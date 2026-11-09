import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDismiss } from '../../lib/scroll.js';
import Icon from '../ui/Icon.jsx';
import LazyImage from '../ui/LazyImage.jsx';
import { mediaTitle } from '../../lib/format.js';
import { formatLabel } from '../anime/Badges.jsx';

export default function SearchBar({ autoFocusOnMount = false, onSubmitted }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebounce(query.trim(), 300);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  useDismiss(boxRef, () => setOpen(false), open);

  useEffect(() => {
    if (autoFocusOnMount) inputRef.current?.focus();
  }, [autoFocusOnMount]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    api
      .suggestions(debounced, { signal: controller.signal, timeout: 8000 })
      .then((res) => setResults((res.data || []).slice(0, 6)))
      .catch((err) => {
        if (err.name !== 'AbortError') setResults([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced]);

  const showPanel = open && query.trim().length >= 2;
  const items = useMemo(() => results, [results]);

  function submit(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  }

  function onKeyDown(e) {
    if (!showPanel) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault();
      setOpen(false);
      navigate(`/anime/${items[active].id}`);
      onSubmitted?.();
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={submit} role="search" className="relative">
        <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search anime..."
          aria-label="Search anime"
          autoComplete="off"
          enterKeyHint="search"
          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-brand/60 focus:bg-white/10 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white" aria-label="Clear search">
            <Icon name="close" size={16} />
          </button>
        )}
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-white/10 bg-surface-2/98 shadow-2xl shadow-black/60 backdrop-blur-md">
          {loading && <div className="px-4 py-3 text-sm text-zinc-500">Searching…</div>}
          {!loading && items.length === 0 && <div className="px-4 py-3 text-sm text-zinc-500">No results for “{query.trim()}”.</div>}
          <ul role="listbox">
            {items.map((m, i) => (
              <li key={m.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    setOpen(false);
                    navigate(`/anime/${m.id}`);
                    onSubmitted?.();
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${i === active ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <LazyImage src={m.coverImage?.large} alt="" className="h-14 w-10 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{mediaTitle(m)}</span>
                    <span className="block text-xs text-zinc-500">{formatLabel(m.format, m.seasonYear)}</span>
                  </span>
                  {m.averageScore != null && <span className="text-xs font-semibold text-amber-400">{(m.averageScore / 10).toFixed(1)}</span>}
                </button>
              </li>
            ))}
          </ul>
          {items.length > 0 && (
            <button type="button" onClick={submit} className="flex w-full items-center justify-between border-t border-white/5 px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
              See all results for “{query.trim()}”
              <Icon name="arrowRight" size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
