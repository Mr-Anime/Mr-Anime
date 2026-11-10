import { Link } from 'react-router-dom';
import LazyImage from '../../ui/LazyImage.jsx';
import { FORMAT_LABELS, mediaTitle } from '../../../lib/format.js';

const RELATION_LABELS = {
  PREQUEL: 'Prequel',
  SEQUEL: 'Sequel',
  SIDE_STORY: 'Side story',
  PARENT: 'Parent',
  SPIN_OFF: 'Spin-off',
  ALTERNATIVE: 'Alternative',
  SUMMARY: 'Summary',
  CHARACTER: 'Character',
  OTHER: 'Other',
};

export default function Relations({ edges = [] }) {
  if (!edges.length) return null;
  const seen = new Set();
  const list = edges.filter((e) => {
    if (seen.has(e.node.id)) return false;
    seen.add(e.node.id);
    return true;
  });

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">Related</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        {list.map((e) => (
          <Link key={`${e.relationType}-${e.node.id}`} to={`/anime/${e.node.id}`} className="group w-[124px] shrink-0">
            <LazyImage src={e.node.coverImage?.large} alt={mediaTitle(e.node)} className="aspect-[2/3] w-full rounded-lg" imgClassName="group-hover:scale-105 transition-transform duration-300" fallbackLabel={mediaTitle(e.node)} />
            <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold uppercase tracking-wide text-brand">{RELATION_LABELS[e.relationType] || e.relationType}</p>
            <p className="line-clamp-2 text-xs text-zinc-300 group-hover:text-white">{mediaTitle(e.node)}</p>
            <p className="text-[11px] text-zinc-500">{FORMAT_LABELS[e.node.format] || e.node.format || ''}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
