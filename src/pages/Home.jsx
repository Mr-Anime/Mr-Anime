import { useCallback } from 'react';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useDocumentMeta } from '../lib/meta.js';
import { mediaTitle } from '../lib/format.js';
import HeroSlider from '../components/anime/HeroSlider.jsx';
import SectionRow from '../components/anime/SectionRow.jsx';
import Container from '../components/ui/Container.jsx';

const ROWS = [
  { key: 'trending', title: 'Trending Now', viewAllHref: '/browse?category=trending' },
  { key: 'popularSeason', title: 'Popular This Season', viewAllHref: '/browse?category=popular' },
  { key: 'topRated', title: 'Top Rated', viewAllHref: '/browse?category=top-rated' },
  { key: 'recentlyUpdated', title: 'Recently Updated', viewAllHref: '/browse?category=recent' },
  { key: 'upcoming', title: 'Upcoming', viewAllHref: '/browse?category=upcoming' },
];

export default function Home() {
  const hero = useApi(useCallback((opts) => api.trending(opts), []));
  const rows = useApi(useCallback((opts) => api.homeRows(opts), []));

  const heroItems = (hero.data?.data || []).slice(0, 10);
  const firstName = heroItems[0] ? mediaTitle(heroItems[0]) : null;

  useDocumentMeta({
    description: 'Stream trending anime with sub and dub, track your watchlist and never miss an episode with Mr.Anime.',
    image: heroItems[0]?.bannerImage,
    jsonLd: firstName
      ? {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Mr.Anime',
          potentialAction: { '@type': 'SearchAction', target: `${window.location.origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
        }
      : null,
  });

  return (
    <>
      <HeroSlider items={heroItems} loading={hero.loading} error={hero.error} onRetry={hero.retry} />

      <Container className="mt-10 space-y-10 md:mt-14 md:space-y-14">
        {ROWS.map((row) => (
          <SectionRow
            key={row.key}
            title={row.title}
            viewAllHref={row.viewAllHref}
            items={rows.data?.rows?.[row.key]?.data}
            loading={rows.loading}
            error={rows.error}
            onRetry={rows.retry}
          />
        ))}
      </Container>
    </>
  );
}
