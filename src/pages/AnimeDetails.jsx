import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useDocumentMeta } from '../lib/meta.js';
import { getEpisodeCount, mediaTitle, FORMAT_LABELS } from '../lib/format.js';
import Container from '../components/ui/Container.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/StateView.jsx';
import DetailsHero from '../components/anime/details/DetailsHero.jsx';
import Synopsis from '../components/anime/details/Synopsis.jsx';
import EpisodeGrid from '../components/anime/details/EpisodeGrid.jsx';
import Characters from '../components/anime/details/Characters.jsx';
import Relations from '../components/anime/details/Relations.jsx';
import Recommendations from '../components/anime/details/Recommendations.jsx';
import WatchlistButton from '../components/anime/details/WatchlistButton.jsx';

export default function AnimeDetails() {
  const { anilistId } = useParams();
  const media = useApi(useCallback((opts) => api.anime(anilistId, opts), [anilistId]));
  const availability = useApi(useCallback((opts) => api.availability(anilistId, opts), [anilistId]));

  const m = media.data?.data;
  const avail = availability.data?.data;

  useDocumentMeta({
    title: m ? mediaTitle(m) : 'Anime',
    description: m ? String(m.description || '').replace(/<[^>]*>/g, '').slice(0, 160) || undefined : undefined,
    image: m?.bannerImage || m?.coverImage?.extraLarge,
    type: 'video.tv_show',
    canonicalPath: `/anime/${anilistId}`,
    jsonLd: m
      ? {
          '@context': 'https://schema.org',
          '@type': 'TVSeries',
          name: mediaTitle(m),
          description: String(m.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
          image: m.coverImage?.extraLarge || m.coverImage?.large,
          genre: m.genres || [],
          numberOfEpisodes: getEpisodeCount(m) || undefined,
          datePublished: m.startDate?.year ? `${m.startDate.year}-${String(m.startDate.month || 1).padStart(2, '0')}-${String(m.startDate.day || 1).padStart(2, '0')}` : undefined,
          aggregateRating: m.averageScore ? { '@type': 'AggregateRating', ratingValue: (m.averageScore / 10).toFixed(1), bestRating: 10 } : undefined,
        }
      : null,
  });

  if (media.error) {
    return (
      <Container className="py-10 md:py-14">
        <ErrorState title="Couldn't load this anime" message={media.error.message} onRetry={media.retry} />
      </Container>
    );
  }

  if (media.loading || !m) return <DetailsSkeleton />;

  return (
    <>
      <DetailsHero media={m} availability={avail}>
        <WatchlistButton anilistId={m.id} />
      </DetailsHero>

      <Container className="mt-10 space-y-12 pb-16 md:mt-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-10">
            <section id="overview">
              <h2 className="mb-3 text-lg font-bold text-white sm:text-xl">Synopsis</h2>
              <Synopsis html={m.description} />
              {m.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {m.tags.slice(0, 8).map((t) => (
                    <span key={t.name} className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-400">{t.name}</span>
                  ))}
                </div>
              )}
            </section>

            <section id="episodes">
              {availability.loading ? <Skeleton className="h-32 w-full rounded-xl" /> : <EpisodeGrid media={m} availability={avail} />}
            </section>

            <Characters edges={m.characters?.edges} />
          </div>

          <aside className="space-y-6">
            <InfoCard media={m} />
          </aside>
        </div>

        <Relations edges={m.relations?.edges} />
        <Recommendations items={(m.recommendations?.nodes || []).map((n) => n.mediaRecommendation || n)} />
      </Container>
    </>
  );
}

function InfoCard({ media }) {
  const rows = [
    ['Format', FORMAT_LABELS[media.format] || media.format],
    ['Episodes', media.episodes || '—'],
    ['Status', media.status ? media.status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : '—'],
    ['Start', media.startDate?.year || '—'],
    ['End', media.endDate?.year || '—'],
    ['Season', media.season ? media.season.charAt(0) + media.season.slice(1).toLowerCase() : '—'],
  ];
  return (
    <div className="rounded-2xl border border-white/5 bg-surface-2/60 p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Information</h2>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-zinc-500">{k}</dt>
            <dd className="text-right font-medium text-zinc-200">{v}</dd>
          </div>
        ))}
      </dl>
      {media.externalLinks?.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <p className="mb-2 text-xs text-zinc-500">Links</p>
          <div className="flex flex-wrap gap-1.5">
            {media.externalLinks.slice(0, 6).map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white">
                {l.site}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <Container className="py-10 md:py-14">
      <div className="flex gap-6">
        <Skeleton className="aspect-[2/3] w-44 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </Container>
  );
}
