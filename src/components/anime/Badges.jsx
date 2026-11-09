import Icon from '../ui/Icon.jsx';
import { formatScore } from '../../lib/format.js';

export function SubBadge({ className = '' }) {
  return (
    <span className={`rounded bg-sky-500/90 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-white ${className}`}>
      SUB
    </span>
  );
}

export function DubBadge({ className = '' }) {
  return (
    <span className={`rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-black ${className}`}>
      DUB
    </span>
  );
}

export function EpisodeBadge({ count, className = '' }) {
  if (!count) return null;
  return (
    <span className={`rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white backdrop-blur ${className}`}>
      EP {count}
    </span>
  );
}

export function ScoreBadge({ score, className = '' }) {
  if (score == null) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${className}`}>
      <Icon name="star" size={12} fill className="text-amber-400" />
      {formatScore(score)}
    </span>
  );
}

export function formatLabel(format, year) {
  const f = format ? format.replace('_', ' ') : '';
  return [f, year].filter(Boolean).join(' · ');
}
