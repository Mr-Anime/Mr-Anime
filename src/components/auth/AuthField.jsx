const inputClass =
  'h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60';

export default function AuthField({ label, htmlFor, error, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-brand" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function AuthInput({ id, label, error, hint, ...rest }) {
  return (
    <AuthField label={label} htmlFor={id} error={error} hint={hint}>
      <input id={id} aria-invalid={Boolean(error)} className={inputClass} {...rest} />
    </AuthField>
  );
}
