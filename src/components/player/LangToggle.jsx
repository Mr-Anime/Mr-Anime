export default function LangToggle({ lang, onChange, availability }) {
  const options = [
    { id: 'sub', label: 'SUB', available: availability?.hasSub !== false, activeClass: 'bg-sky-500 text-white' },
    { id: 'dub', label: 'DUB', available: availability?.hasDub !== false, activeClass: 'bg-amber-500 text-white' },
  ];
  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5" role="group" aria-label="Audio language">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={!o.available}
          onClick={() => onChange(o.id)}
          aria-pressed={lang === o.id}
          title={o.available ? undefined : 'Not available for this title'}
          className={`h-7 rounded-md px-2.5 text-xs font-bold transition-colors ${
            lang === o.id ? o.activeClass : o.available ? 'text-zinc-300 hover:text-white' : 'cursor-not-allowed text-zinc-600'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
