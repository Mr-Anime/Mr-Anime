import { useState } from 'react';
import LazyImage from '../../ui/LazyImage.jsx';

export default function Characters({ edges = [] }) {
  const [tab, setTab] = useState('MAIN');
  const titled = edges.filter((e) => e.role === 'MAIN');
  const main = titled.length ? titled : edges;
  const list = tab === 'MAIN' ? main : edges.filter((e) => e.role !== 'MAIN');
  if (!edges.length) return null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">Characters & Voice Actors</h2>
        {titled.length > 0 && (
          <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
            {['MAIN', 'SUPPORTING'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${tab === t ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                {t === 'MAIN' ? 'Main' : 'Supporting'}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-zinc-500">No characters listed.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((e) => {
            const va = e.voiceActors?.[0];
            return (
              <div key={e.node.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-surface-2/60 p-2">
                <Person image={e.node.image?.medium} name={e.node.name?.full} sub={e.role === 'MAIN' ? 'Main' : 'Supporting'} />
                {va ? <Person image={null} name={va.name?.full} sub={va.language} right /> : <span className="w-10" />}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Person({ image, name, sub, right = false }) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${right ? 'flex-row-reverse text-right' : ''}`}>
      <LazyImage src={image} alt="" className="h-14 w-10 shrink-0 rounded-md bg-surface-3" fallbackLabel={name?.charAt(0)} />
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-medium text-zinc-100">{name}</p>
        <p className="text-[11px] text-zinc-500">{sub}</p>
      </div>
    </div>
  );
}
