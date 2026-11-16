import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import Container from '../components/ui/Container.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/StateView.jsx';

const PARAM_NAMES = ['client_id', 'redirect_uri', 'response_type', 'scope', 'state', 'code_challenge', 'code_challenge_method'];

export default function OAuthAuthorize() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [busy, setBusy] = useState(false);

  useDocumentMeta({
    title: 'Authorize app',
    description: 'Approve or deny a developer app request to use your Mr.Anime account.',
  });

  const search = params.toString();
  const request = useMemo(() => {
    const sp = new URLSearchParams(search);
    return Object.fromEntries(PARAM_NAMES.map((name) => [name, sp.get(name) || '']));
  }, [search]);

  const canRequest = Boolean(request.client_id && request.redirect_uri && request.response_type);
  const info = useApi(
    useCallback((opts) => api.oauthAuthorizeInfo(request, opts), [request]),
    [],
    { enabled: canRequest },
  );

  const app = info.data?.data;

  const approve = async () => {
    setBusy(true);
    try {
      const res = await api.approveOauth(request);
      window.location.assign(res.data.redirectTo);
    } catch (err) {
      toastError(err.message);
      setBusy(false);
    }
  };

  const deny = () => {
    if (!app) return;
    const url = new URL(app.redirectUri);
    url.searchParams.set('error', 'access_denied');
    if (request.state) url.searchParams.set('state', request.state);
    window.location.assign(url.toString());
  };

  const shell = (children) => (
    <Container className="py-10 md:py-16">
      <div className="mx-auto max-w-lg">{children}</div>
    </Container>
  );

  if (!canRequest) {
    return shell(
      <ErrorState
        title="Invalid authorization request"
        message="client_id, redirect_uri and response_type are required."
      />,
    );
  }

  if (info.error) {
    return shell(
      <ErrorState title="Can't authorize this app" message={info.error.message} onRetry={info.retry} />,
    );
  }

  if (info.loading || !app) {
    return shell(
      <div className="space-y-3 rounded-2xl border border-white/5 bg-surface-2/50 p-6">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>,
    );
  }

  let host = app.redirectUri;
  try {
    host = new URL(app.redirectUri).host;
  } catch {
    /* keep the raw URI for display */
  }

  return shell(
    <div className="rounded-2xl border border-white/5 bg-surface-2/50 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
          <Icon name="lock" size={22} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-white">Authorize {app.appName}</h1>
          <p className="text-xs text-zinc-500">OAuth 2.0 · Mr.Anime developer API</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-300">
        <span className="font-medium text-white">{app.appName}</span> wants to access the Mr.Anime API as{' '}
        <span className="font-medium text-white">{user?.email || 'this account'}</span>.
      </p>

      <ul className="mt-4 space-y-2 rounded-xl border border-white/5 bg-black/20 p-3 text-sm text-zinc-300">
        <li className="flex items-start gap-2">
          <Icon name="checkCircle" size={16} className="mt-0.5 shrink-0 text-emerald-400" />
          Read anime details and streaming server links.
        </li>
      </ul>

      <p className="mt-4 text-xs text-zinc-500">
        You will be sent to <span className="font-mono text-zinc-400">{host}</span>. You can revoke access anytime
        from the Developer API page.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
        <Button onClick={approve} loading={busy} className="sm:flex-1">
          Authorize
        </Button>
        <Button variant="secondary" onClick={deny} disabled={busy} className="sm:flex-1">
          Cancel
        </Button>
      </div>
    </div>,
  );
}
