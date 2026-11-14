import { Link } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import { EmptyState, ErrorState } from '../ui/StateView.jsx';

export default function OverrideTable({ rows, loading, error, onRetry, onEdit, onDelete, busyId }) {
  if (loading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (error) return <ErrorState title="Couldn't load overrides" message={error.message} onRetry={onRetry} />;
  if (!rows?.length) return <EmptyState icon="settings" title="No overrides yet" description="Add an override to mark a title's SUB/DUB availability or cap its episode count." />;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/5">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">AniList ID</th>
            <th scope="col" className="px-3 py-2 font-medium">SUB</th>
            <th scope="col" className="px-3 py-2 font-medium">DUB</th>
            <th scope="col" className="px-3 py-2 font-medium">Episodes (sub / dub)</th>
            <th scope="col" className="px-3 py-2 font-medium">Updated</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r) => (
            <tr key={r.anilistId} className="hover:bg-white/[0.02]">
              <td className="px-3 py-2 font-mono text-xs text-zinc-300">
                <Link to={`/info/${r.anilistId}`} className="hover:text-brand">{r.anilistId}</Link>
              </td>
              <td className="px-3 py-2"><Flag on={r.hasSub} /></td>
              <td className="px-3 py-2"><Flag on={r.hasDub} /></td>
              <td className="px-3 py-2 text-zinc-400">{r.subEpisodes ?? 'all'} / {r.dubEpisodes ?? 'all'}</td>
              <td className="px-3 py-2 text-xs text-zinc-500">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}</td>
              <td className="px-3 py-2">
                <div className="flex justify-end gap-1">
                  <button type="button" onClick={() => onEdit(r)} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white" aria-label={`Edit override for ${r.anilistId}`}>
                    <Icon name="settings" size={15} />
                  </button>
                  <button type="button" onClick={() => onDelete(r)} disabled={busyId === r.anilistId} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-brand/15 hover:text-brand" aria-label={`Delete override for ${r.anilistId}`}>
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Flag({ on }) {
  return on ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300"><Icon name="check" size={13} />Yes</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500"><Icon name="close" size={13} />No</span>
  );
}
