import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : null;
  const message = status === 404 ? "We couldn't find that page." : 'Something went wrong while loading this page.';

  return (
    <div className="grid min-h-dvh place-items-center bg-surface px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold tracking-widest text-brand">{status || 'Error'}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">{status === 404 ? 'Page not found' : 'Unexpected error'}</h1>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
            Retry
          </button>
          <Link to="/" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
