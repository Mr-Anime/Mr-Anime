import { useCallback, useState } from 'react';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui/StateView.jsx';

const ENDPOINTS = [
  ['GET', '/api/player/{anilistId}/{episode}?lang=sub|dub', 'Streaming servers + embed URLs for one episode.'],
  ['GET', '/api/search?q=', 'Title search (no token).'],
  ['GET', '/api/trending', 'Trending titles (no token).'],
  ['GET', '/api/schedule', 'Airing schedule (no token).'],
];

export default function Developer() {
  const { success, error: toastError } = useToast();
  const tokens = useApi(useCallback((opts) => api.devTokens(opts), []));
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [copied, setCopied] = useState(false);

  useDocumentMeta({ title: 'Developer API', description: 'Create API tokens to use the Mr.Anime player API from your own app.' });

  const list = tokens.data?.data || [];
  const origin = typeof window === 'undefined' ? 'https://mranime.cyou' : window.location.origin;

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.createDevToken(name.trim() || 'API token');
      setCreated(res.data.token);
      setName('');
      setCopied(false);
      tokens.retry();
      success('Token created. Copy it now — it is only shown once.');
    } catch (err) {
      toastError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created);
      setCopied(true);
    } catch {
      toastError('Copy failed — select the token text and copy it manually.');
    }
  };

  const revoke = async (id) => {
    if (!window.confirm('Revoke this token? Apps using it will stop working immediately.')) return;
    setBusyId(id);
    try {
      await api.revokeDevToken(id);
      success('Token revoked.');
      tokens.retry();
    } catch (err) {
      toastError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title="Developer API" description="Create a personal token to call the Mr.Anime player API from your own app or bot." />

      <section className="mb-8 rounded-2xl border border-white/5 bg-surface-2/50 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Create a token</h2>
        <form onSubmit={create} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="token-name">Token name</label>
          <input
            id="token-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="e.g. Discord bot"
            className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-zinc-500 focus:border-brand/60 focus:outline-none"
          />
          <Button type="submit" loading={creating}>
            <Icon name="plus" size={16} />
            Generate token
          </Button>
        </form>

        {created && (
          <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
            <p className="text-xs font-semibold text-amber-300">Copy this token now. It will not be shown again.</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 break-all rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-zinc-200">{created}</code>
              <Button size="sm" variant="secondary" onClick={copy}>
                <Icon name={copied ? 'check' : 'edit'} size={14} />
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Your tokens</h2>
        {tokens.error ? (
          <ErrorState title="Couldn't load tokens" message={tokens.error.message} onRetry={tokens.retry} />
        ) : tokens.loading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : list.length === 0 ? (
          <EmptyState icon="lock" title="No tokens yet" description="Generate a token above to start using the API." />
        ) : (
          <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/5 bg-surface-2/50">
            {list.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{t.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">
                    {t.prefix}… · created {new Date(t.createdAt).toLocaleDateString()}
                    {t.lastUsedAt ? ` · last used ${new Date(t.lastUsedAt).toLocaleDateString()}` : ' · never used'}
                  </p>
                </div>
                <Button size="sm" variant="secondary" loading={busyId === t.id} onClick={() => revoke(t.id)}>
                  <Icon name="trash" size={14} />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Usage</h2>
        <p className="text-sm text-zinc-400">
          Send the token as a bearer header. Browser requests from Mr.Anime itself are allowed without a token.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-white/5 bg-black/50 p-3 text-xs leading-relaxed text-zinc-300">
{`curl -H "Authorization: Bearer <your-token>" \\
  "${origin}/api/player/16498/1?lang=sub"`}
        </pre>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Endpoints</h2>
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Method</th>
                <th scope="col" className="px-3 py-2 font-medium">Path</th>
                <th scope="col" className="px-3 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ENDPOINTS.map(([method, path, description]) => (
                <tr key={path}>
                  <td className="px-3 py-2 font-mono text-xs text-brand">{method}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-300">{path}</td>
                  <td className="px-3 py-2 text-xs text-zinc-400">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Container>
  );
}
