import { useEffect, useState } from 'react';
import Button from '../ui/Button.jsx';

const inputClass = 'h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-brand/60 focus:outline-none';

const EMPTY = { anilistId: '', hasSub: true, hasDub: true, subEpisodes: '', dubEpisodes: '' };

/** Create/edit form for availability overrides. */
export default function OverrideForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(initial ? { ...initial, subEpisodes: initial.subEpisodes ?? '', dubEpisodes: initial.dubEpisodes ?? '' } : EMPTY);
    setError('');
  }, [initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const id = Number(form.anilistId);
    if (!Number.isInteger(id) || id < 1) return setError('AniList ID must be a positive number.');
    const num = (v) => (v === '' ? null : Number(v));
    if (num(form.subEpisodes) != null && (!Number.isInteger(num(form.subEpisodes)) || num(form.subEpisodes) < 0)) return setError('Sub episode cap must be a whole number.');
    if (num(form.dubEpisodes) != null && (!Number.isInteger(num(form.dubEpisodes)) || num(form.dubEpisodes) < 0)) return setError('Dub episode cap must be a whole number.');
    setError('');
    onSave({ anilistId: id, hasSub: form.hasSub, hasDub: form.hasDub, subEpisodes: num(form.subEpisodes), dubEpisodes: num(form.dubEpisodes) });
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-surface-3/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">AniList ID</span>
          <input className={inputClass} inputMode="numeric" value={form.anilistId} onChange={set('anilistId')} placeholder="5114" disabled={Boolean(initial)} />
        </label>
        <div className="flex items-end gap-4 pb-2">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.hasSub} onChange={set('hasSub')} className="h-4 w-4 accent-brand" /> SUB
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" checked={form.hasDub} onChange={set('hasDub')} className="h-4 w-4 accent-brand" /> DUB
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">SUB episode cap (blank = all)</span>
          <input className={inputClass} inputMode="numeric" value={form.subEpisodes} onChange={set('subEpisodes')} placeholder="all" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-zinc-400">DUB episode cap (blank = all)</span>
          <input className={inputClass} inputMode="numeric" value={form.dubEpisodes} onChange={set('dubEpisodes')} placeholder="all" />
        </label>
      </div>
      {error && <p className="mt-3 text-xs text-brand" role="alert">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="submit" loading={saving}>{initial ? 'Save changes' : 'Add override'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
