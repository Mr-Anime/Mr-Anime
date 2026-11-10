import { useState } from 'react';
import Icon from '../ui/Icon.jsx';
import { FORMATS, GENRES, SEASONS, SORT_OPTIONS, STATUS_OPTIONS, yearOptions } from '../../lib/discovery.js';

const selectClass = 'h-9 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm text-zinc-200 focus:border-brand/60 focus:outline-none';

function Select({ label, value, onChange, children }) {
  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <select className={selectClass} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {children}
      </select>
    </label>
  );
}

/**
 * Genre chips + format/season/year/status/sort selects.
 * `value` is a plain object of API params; `onChange(patch|null)` merges or resets a key.
 */
export default function FilterBar({ value, onReset, showGenres = true }) {
  const [expanded, setExpanded] = useState(
    Boolean(value.format || value.season || value.year || value.status || value.sort),
  );
  const set = (key) => (v) => value.onChange({ [key]: v || undefined });
  const toggleGenre = (g) => {
    const current = (value.genre || '').split(',').filter(Boolean);
    const next = current.includes(g) ? current.filter((x) => x !== g) : [...current, g];
    value.onChange({ genre: next.length ? next.join(',') : undefined });
  };
  const activeGenres = (value.genre || '').split(',').filter(Boolean);
  const activeCount = ['format', 'season', 'year', 'status', 'sort'].filter((k) => value[k]).length;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-zinc-200 transition-colors hover:border-white/30"
          aria-expanded={expanded}
        >
          <Icon name="filter" size={16} />
          Filters
          {activeCount > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">{activeCount}</span>}
          <Icon name="chevronDown" size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {(activeCount > 0 || activeGenres.length > 0) && (
          <button type="button" onClick={onReset} className="h-9 rounded-lg px-2.5 text-sm text-zinc-400 hover:text-brand">
            Clear all
          </button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/5 bg-surface-2/50 p-3">
          <Select label="Sort" value={value.sort || ''} onChange={set('sort')}>
            <option value="">Sort: default</option>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select label="Status" value={value.status || ''} onChange={set('status')}>
            <option value="">Any status</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select label="Format" value={value.format || ''} onChange={set('format')}>
            <option value="">Any format</option>
            {FORMATS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select label="Season" value={value.season || ''} onChange={set('season')}>
            <option value="">Any season</option>
            {SEASONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Select label="Year" value={value.year || ''} onChange={set('year')}>
            <option value="">Any year</option>
            {yearOptions().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
      )}

      {showGenres && (
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {GENRES.map((g) => {
            const active = activeGenres.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/30 hover:text-white'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
