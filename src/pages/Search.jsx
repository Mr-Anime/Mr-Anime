import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';
import { useDocumentMeta } from '../lib/meta.js';
import Container from '../components/ui/Container.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import ResultsView from '../components/anime/ResultsView.jsx';

const QUICK = ['Frieren', 'One Piece', 'Jujutsu Kaisen', 'Chainsaw Man', 'Oshi no Ko'];

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const q = (sp.get('q') || '').trim();
  const page = Number(sp.get('page') || 1);

  const query = useApi(
    useCallback((opts) => api.search({ q, page, perPage: 24 }, opts), [q, page]),
    [q, page],
    { enabled: q.length >= 2 },
  );

  useDocumentMeta({
    title: q ? `Search: ${q}` : 'Search',
    description: q ? `Anime search results for "${q}" on Mr.Anime.` : 'Search thousands of anime titles on Mr.Anime.',
  });

  const goToPage = (p) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      if (p > 1) next.set('page', String(p));
      else next.delete('page');
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container className="py-8 md:py-12">
      <PageHeader title={q ? `Results for “${q}”` : 'Search anime'} description={q ? null : 'Type at least two characters to search.'} />

      {q.length < 2 ? (
        <div className="rounded-2xl border border-white/5 bg-surface-2/50 p-6">
          <p className="text-sm text-zinc-300">Popular searches</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK.map((term) => (
              <Button key={term} size="sm" variant="secondary" onClick={() => setSp({ q: term })}>
                {term}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <ResultsView
          data={query.data}
          loading={query.loading}
          error={query.error}
          onRetry={query.retry}
          emptyTitle={`No results for “${q}”`}
          emptyDescription="Check the spelling or try a shorter term."
          onPageChange={goToPage}
        />
      )}
    </Container>
  );
}
