import Icon from './Icon.jsx';
import Button from './Button.jsx';

export function EmptyState({ icon = 'film', title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-surface-2/60 px-6 py-14 text-center ${className}`}>
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-zinc-400">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-brand/20 bg-brand/5 px-6 py-14 text-center ${className}`} role="alert">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand/15 text-brand">
        <Icon name="alert" size={26} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-400">{message || 'We could not load this right now. Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          Try again
        </Button>
      )}
    </div>
  );
}
