import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Mr.Anime] Unhandled render error', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-dvh place-items-center bg-surface px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand/15 text-3xl">💥</div>
          <h1 className="mt-5 text-2xl font-extrabold text-white">Unexpected error</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Something broke while rendering this page. Reload to try again — your watch data is safe.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-black/40 p-3 text-left text-xs text-brand/90">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => window.location.reload()} className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600">
              Reload page
            </button>
            <a href="/" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10">
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
