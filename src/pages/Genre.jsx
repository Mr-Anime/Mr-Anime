import { useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useDocumentMeta } from '../lib/meta.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import FilterBar from '../components/anime/FilterBar.jsx';
import ResultsView from '../components/anime/ResultsView.jsx';

export default function Genre() {
  const { name = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get('page') || 1);
  const genre = decodeURIComponent(name);

  const extra = {
    format: sp.get('format') || undefined,
    season: sp.get('season') || undefined,
    year: sp.get('year') || undefined,
    status: sp.get('status') || undefined,
    sort: sp.get('sort') || undefined,
  };

  const query = useApi(
    useCallback((opts) => api.search({ genre, page, perPage: 24, ...extra }, opts), [genre, page, JSON.stringify(extra)]),
  );

  useDocumentMeta({ title: `${genre} anime`, description: `Watch the best ${genre} anime on Mr.Anime.` });

  const update = (patch, { resetPage = true } = {}) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') next.delete(k);
        else next.set(k, String(v));
      }
      if (resetPage) next.delete('page');
      return next;
    });
  };

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={`${genre} anime`} description={`Highly rated ${genre} series and movies.`} />
      <FilterBar
        showGenres={false}
        value={{ ...extra, onChange: (patch) => update(patch) }}
        onReset={() => setSp((prev) => {
          const next = new URLSearchParams();
          if (prev.get('page')) next.set('page', prev.get('page'));
          return next;
        })}
      />
      <ResultsView
        data={query.data}
        loading={query.loading}
        error={query.error}
        onRetry={query.retry}
        emptyTitle={`No ${genre} anime found`}
        emptyDescription="Try another genre or loosen the filters."
        onPageChange={(p) => {
          update({ page: p > 1 ? p : null }, { resetPage: false });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </Container>
  );
}
