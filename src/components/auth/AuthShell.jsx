import { Link } from 'react-router-dom';
import Logo from '../layout/Logo.jsx';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(244,63,94,0.18),transparent_70%)]" />
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface-2/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-md sm:p-8">
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-zinc-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-zinc-400">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthLink({ to, children }) {
  return (
    <Link to={to} className="font-medium text-brand hover:text-brand/80">
      {children}
    </Link>
  );
}
