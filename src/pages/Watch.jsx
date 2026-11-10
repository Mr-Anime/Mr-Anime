import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useDocumentMeta } from '../lib/meta.js';
import { buildEmbedUrl, getProvider, LANGS, PROVIDERS } from '../config/providers.js';
import { mediaTitle, formatScore, FORMAT_LABELS } from '../lib/format.js';
import { logEpisodeWatched, setWatchlistStatus } from '../lib/library.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import Container from '../components/ui/Container.jsx';
import Icon from '../components/ui/Icon.jsx';
import { EmptyState, ErrorState } from '../components/ui/StateView.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import PlayerFrame from '../components/player/PlayerFrame.jsx';
import ProviderSwitcher from '../components/player/ProviderSwitcher.jsx';
import LangToggle from '../components/player/LangToggle.jsx';
import EpisodeNav from '../components/player/EpisodeNav.jsx';
import UpNext from '../components/player/UpNext.jsx';

export default function Watch() {
  const { anilistId, episode: episodeParam } = useParams();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [preferredProvider, setPreferredProvider] = useLocalStorage('mranime:provider', PROVIDERS[0].id);

  const episode = Math.max(1, Number(episodeParam) || 1);
  const media = useApi(useCallback((opts) => api.anime(anilistId, opts), [anilistId]));
  const availability = useApi(useCallback((opts) => api.availability(anilistId, opts), [anilistId]));
  const schedule = useApi(useCallback((opts) => api.schedule({}, opts), []));

  const m = media.data?.data;
  const avail = availability.data?.data;

  useDocumentMeta({
    title: m ? `Watch ${mediaTitle(m)} — Episode ${episode}` : 'Watch',
    description: m ? `Stream ${mediaTitle(m)} episode ${episode} with sub and dub on Mr.Anime.` : undefined,
    image: m?.bannerImage || m?.coverImage?.extraLarge,
    type: 'video.episode',
  });

  const subAllowed = avail?.hasSub !== false;
  const dubAllowed = avail?.hasDub !== false;
  const langParam = sp.get('lang');
  const lang = LANGS.includes(langParam) && (langParam === 'sub' ? subAllowed : dubAllowed) ? langParam : subAllowed ? 'sub' : 'dub';

  const providerId = sp.get('server') || preferredProvider;
  const provider = getProvider(providerId);

  const totalEpisodes = useMemo(() => {
    if (!m) return 0;
    const raw = m.episodes || (m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : 0);
    const cap = lang === 'dub' ? avail?.dubEpisodes : avail?.subEpisodes;
    return cap ? Math.min(raw, cap) : raw;
  }, [m, avail, lang]);

  // Remember the chosen server across sessions.
  useEffect(() => {
    if (sp.get('server')) setPreferredProvider(providerId);
  }, [providerId, sp, setPreferredProvider]);

  // Record progress: history row + move watchlist entry to "watching".
  useEffect(() => {
    if (!user || !m) return;
    logEpisodeWatched(user.id, m.id, episode);
    setWatchlistStatus(user.id, m.id, 'watching').catch(() => {});
  }, [user?.id, m?.id, episode]);

  useEffect(() => {
    if (totalEpisodes && episode > totalEpisodes) navigate(`/watch/${anilistId}/${totalEpisodes}?lang=${lang}`, { replace: true });
  }, [totalEpisodes, episode, anilistId, lang, navigate]);

  const embedUrl = m ? buildEmbedUrl(provider, { anilistId: m.id, episode, lang }) : null;
  const supported = Boolean(embedUrl);

  const setLang = (next) => {
    setSp((prev) => {
      const p = new URLSearchParams(prev);
      p.set('lang', next);
      return p;
    });
  };
  const setServer = (id) => {
    setSp((prev) => {
      const p = new URLSearchParams(prev);
      p.set('server', id);
      return p;
    });
  };

  if (media.error) {
    return (
      <Container className="py-10">
        <ErrorState title="Couldn't load this episode" message={media.error.message} onRetry={media.retry} />
      </Container>
    );
  }

  if (media.loading || !m) {
    return (
      <Container className="py-6">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="mt-4 h-7 w-1/2" />
        <Skeleton className="mt-2 h-4 w-1/3" />
      </Container>
    );
  }

  const noStreams = avail && !avail.hasSub && !avail.hasDub;

  return (
    <Container className="py-4 md:py-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {availability.loading ? (
            <Skeleton className="aspect-video w-full rounded-xl" />
          ) : noStreams ? (
            <EmptyState icon="film" title="No streams available" description="This title isn't available in SUB or DUB right now. Try again later." />
          ) : supported ? (
            <PlayerFrame src={embedUrl} provider={provider} title={`${mediaTitle(m)} episode ${episode}`} />
          ) : (
            <EmptyState icon="alert" title="No stream on this server" description={`${provider.name} doesn't support ${lang.toUpperCase()}. Pick another server below.`} />
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <LangToggle lang={lang} onChange={setLang} availability={avail} />
            <ProviderSwitcher providers={PROVIDERS} activeId={provider.id} lang={lang} onChange={setServer} />
          </div>

          <div className="mt-5">
            <h1 className="text-lg font-bold text-white sm:text-xl">
              <Link to={`/anime/${m.id}`} className="hover:text-brand">{mediaTitle(m)}</Link>
              <span className="ml-2 text-zinc-400">Episode {episode}</span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              {FORMAT_LABELS[m.format] && <span>{FORMAT_LABELS[m.format]}</span>}
              {m.averageScore != null && (
                <span className="inline-flex items-center gap-1">
                  <Icon name="star" size={11} fill className="text-amber-400" />
                  {formatScore(m.averageScore)}
                </span>
              )}
              <span className="uppercase">{lang}</span>
              <span>·</span>
              <span>{provider.name}</span>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/5 bg-surface-2/50 p-3">
            <EpisodeNav mediaId={m.id} episode={episode} count={totalEpisodes} lang={lang} />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Mr.Anime does not host any video files. All streams are embedded from third-party providers. If a server
            fails to load, switch to another server or report it on our <Link to="/dmca" className="text-zinc-300 hover:text-brand">contact page</Link>.
          </p>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-surface-2/60 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">About this anime</h2>
              <Link to={`/anime/${m.id}`} className="text-xs text-brand hover:underline">Details</Link>
            </div>
            <p className="mt-2 line-clamp-5 text-xs leading-relaxed text-zinc-400">{String(m.description || '').replace(/<[^>]*>/g, '')}</p>
          </div>
          {schedule.data?.airingSchedules?.length > 0 && <UpNext slots={schedule.data.airingSchedules} currentId={m.id} />}
        </aside>
      </div>
    </Container>
  );
}
