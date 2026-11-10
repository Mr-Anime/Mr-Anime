import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LazyImage from '../../ui/LazyImage.jsx';
import { SubBadge, DubBadge } from '../Badges.jsx';

const PAGE = 24;

/**
 * Episode picker. Available episodes are clamped by availability
 * (a dub override with 4 episodes only exposes episodes 1–4, etc.).
 */
export default function EpisodeGrid({ media, availability }) {
  const total = media.episodes || (media.nextAiringEpisode ? media.nextAiringEpisode.episode - 1 : 0);
  const [lang, setLang] = useState(availability?.hasDub && !availability?.hasSub ? 'dub' : 'sub');
  const [page, setPage] = useState(0);

  const langAvailable = lang === 'dub' ? availability?.hasDub !== false : availability?.hasSub !== false;
  const cap = lang === 'dub' ? availability?.dubEpisodes : availability?.subEpisodes;
  const count = cap ? Math.min(total, cap) : total;

  const episodes = useMemo(() => Array.from({ length: Math.max(0, count) }, (_, i) => i + 1), [count]);
  const pages = Math.ceil(episodes.length / PAGE) || 1;
  const currentPage = Math.min(page, pages - 1);
  const visible = episodes.slice(currentPage * PAGE, currentPage * PAGE + PAGE);

  if (!total) return <p className="text-sm text-zinc-500">No episodes listed yet.</p>;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">Episodes</h2>
        <div className="flex items-center gap-2 text-xs">
          {availability?.hasSub !== false && (
            <button type="button" onClick={() => { setLang('sub'); setPage(0); }} aria-pressed={lang === 'sub'} className={`rounded-full px-2.5 py-1 font-bold transition-colors ${lang === 'sub' ? 'bg-sky-500 text-white' : 'bg-white/10 text-zinc-300'}`}>
              SUB
            </button>
          )}
          {availability?.hasDub !== false && (
            <button type="button" onClick={() => { setLang('dub'); setPage(0); }} aria-pressed={lang === 'dub'} className={`rounded-full px-2.5 py-1 font-bold transition-colors ${lang === 'dub' ? 'bg-amber-500 text-white' : 'bg-white/10 text-zinc-300'}`}>
              DUB
            </button>
          )}
        </div>
      </div>

      {!langAvailable || count === 0 ? (
        <p className="rounded-xl border border-white/5 bg-surface-2/60 px-4 py-6 text-sm text-zinc-400">
          {lang.toUpperCase()} episodes are not available for this title yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {visible.map((ep) => (
              <Link
                key={ep}
                to={`/watch/${media.id}/${ep}?lang=${lang}`}
                className="grid h-11 place-items-center rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-zinc-200 transition-colors hover:border-brand/60 hover:bg-brand/15 hover:text-white"
              >
                {ep}
              </Link>
            ))}
          </div>
          {pages > 1 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  aria-current={i === currentPage ? 'page' : undefined}
                  className={`h-7 min-w-7 rounded-md px-2 text-xs font-medium ${i === currentPage ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/10'}`}
                >
                  {i * PAGE + 1}&ndash;{Math.min((i + 1) * PAGE, count)}
                </button>
              ))}
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <SubBadge />
            <DubBadge />
            <span className="text-xs text-zinc-500">{count} of {total} episodes available</span>
          </div>
        </>
      )}
      <div className="mt-3 flex items-center gap-3">
        <LazyImage src={media.coverImage?.large} alt="" className="h-12 w-9 rounded-md" />
        <p className="text-xs text-zinc-500">Stream in up to 1080p with multiple embed providers.</p>
      </div>
    </section>
  );
}
