import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useDocumentMeta } from '../lib/meta.js';
import { CATEGORIES, categoryById, filtersToParams } from '../lib/discovery.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import FilterBar from '../components/anime/FilterBar.jsx';
import ResultsView from '../components/anime/ResultsView.jsx';

export default function Browse() {
  const [sp, setSp] = useSearchParams();
  const category = categoryById(sp.get('category') || 'trending');
  const page = Number(sp.get('page') || 1);

  const apiParams = { ...category.params, ...filtersToParams(sp) };
  delete apiParams.page;

  const query = useApi(
    useCallback((opts) => api.search({ ...apiParams, page }, opts), [JSON.stringify(apiParams), page]),
  );

  useDocumentMeta({ title: `Browse · ${category.label}`, description: `Discover ${category.label.toLowerCase()} anime on Mr.Anime.` });

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

  const resetFilters = () => {
    setSp((prev) => {
      const next = new URLSearchParams();
      const cat = prev.get('category');
      if (cat) next.set('category', cat);
      return next;
    });
  };

  const filterValue = {
    genre: sp.get('genre') || '',
    format: sp.get('format') || '',
    season: sp.get('season') || '',
    year: sp.get('year') || '',
    status: sp.get('status') || '',
    sort: sp.get('sort') || '',
    onChange: (patch) => update(patch),
  };

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title="Browse anime" description="Filter by genre, format, season and more." />

      <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={c.id === category.id ? 'primary' : 'secondary'}
            onClick={() => update({ category: c.id }, { resetPage: true })}
            className="shrink-0"
          >
            {c.label}
          </Button>
        ))}
      </div>

      <FilterBar value={filterValue} onReset={resetFilters} />

      <ResultsView
        data={query.data}
        loading={query.loading}
        error={query.error}
        onRetry={query.retry}
        emptyTitle="No anime match these filters"
        emptyDescription="Try removing a filter or switching category."
        onPageChange={(p) => {
          update({ page: p > 1 ? p : null }, { resetPage: false });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </Container>
  );
}
