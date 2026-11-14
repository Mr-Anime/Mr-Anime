import { Link } from 'react-router-dom';
import LazyImage from '../ui/LazyImage.jsx';
import { FORMAT_LABELS, mediaTitle } from '../../lib/format.js';
import { playerPath } from '../../lib/slug.js';

/** Sidebar of the next scheduled episodes with Watch shortcuts. */
export default function UpNext({ slots = [], currentId }) {
  const list = slots.filter((s) => s.media?.id !== Number(currentId)).slice(0, 8);
  if (!list.length) return null;

  return (
    <section className="rounded-2xl border border-white/5 bg-surface-2/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Up next</h2>
      <ul className="space-y-2.5">
        {list.map((s) => (
          <li key={`${s.media.id}-${s.episode}`}>
            <Link to={playerPath(s.media, s.episode, 'sub')} className="group flex items-center gap-3">
              <LazyImage src={s.media.coverImage?.large} alt={mediaTitle(s.media)} className="h-16 w-11 shrink-0 rounded-md" fallbackLabel={mediaTitle(s.media)} />
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-medium text-zinc-100 group-hover:text-brand">{mediaTitle(s.media)}</p>
                <p className="text-xs text-zinc-500">
                  EP {s.episode}
                  {FORMAT_LABELS[s.media.format] ? ` · ${FORMAT_LABELS[s.media.format]}` : ''}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
