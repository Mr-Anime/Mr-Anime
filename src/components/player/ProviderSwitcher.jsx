import Icon from '../ui/Icon.jsx';

/** Provider pills; disabled when the provider does not support the active language. */
export default function ProviderSwitcher({ providers, activeId, lang, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Server</span>
      <div className="flex flex-wrap gap-1.5">
        {providers.map((p) => {
          const supported = p.supports ? p.supports.includes(lang) : true;
          const active = p.id === activeId;
          return (
            <button
              key={p.id}
              type="button"
              disabled={!supported}
              onClick={() => onChange(p.id)}
              aria-pressed={active}
              title={supported ? `Stream from ${p.name}` : `${p.name} has no ${lang.toUpperCase()} streams`}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                active
                  ? 'border-brand bg-brand/15 text-white'
                  : supported
                    ? 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/30 hover:text-white'
                    : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600'
              }`}
            >
              {active && <Icon name="check" size={12} />}
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
