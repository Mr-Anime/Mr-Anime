import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { playerPath } from '../../lib/slug.js';

/** Prev / next episode + a scrollable episode strip (bounded by availability). */
export default function EpisodeNav({ media, episode, count, lang }) {
  const wrap = (n) => Math.min(Math.max(1, n), Math.max(1, count));
  const prevDisabled = episode <= 1;
  const nextDisabled = count > 0 && episode >= count;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          to={playerPath(media, wrap(episode - 1), lang)}
          aria-disabled={prevDisabled}
          tabIndex={prevDisabled ? -1 : undefined}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm ${
            prevDisabled ? 'pointer-events-none opacity-40' : 'text-zinc-200 hover:border-white/30 hover:text-white'
          }`}
        >
          <Icon name="skipBack" size={15} />
          Prev
        </Link>
        <span className="text-xs text-zinc-500">Episode {episode} of {count || '?'}</span>
        <Link
          to={playerPath(media, wrap(episode + 1), lang)}
          aria-disabled={nextDisabled}
          tabIndex={nextDisabled ? -1 : undefined}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm ${
            nextDisabled ? 'pointer-events-none opacity-40' : 'text-zinc-200 hover:border-white/30 hover:text-white'
          }`}
        >
          Next
          <Icon name="skipForward" size={15} />
        </Link>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1" role="list" aria-label="Episodes">
        {Array.from({ length: count || 0 }, (_, i) => i + 1).map((ep) => {
          const active = ep === episode;
          return (
            <div key={ep} role="listitem" ref={active ? (el) => el?.scrollIntoView({ block: 'nearest', inline: 'center' }) : undefined}>
              <Link
                to={playerPath(media, ep, lang)}
                aria-current={active ? 'page' : undefined}
                className={`grid h-8 min-w-9 place-items-center rounded-md px-2 text-xs font-medium transition-colors ${
                  active ? 'bg-brand text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                {ep}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
