import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { PaperCard } from '../components/PaperCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { LoadMore } from '../components/LoadMore';
import { useDebounce } from '../hooks/useCommon';

export default function Research() {
  const [params, setParams] = useSearchParams();
  const qParam = params.get('q') || '';
  const [query, setQuery] = useState(qParam);
  const debouncedQ = useDebounce(query, 300);
  const [state, setState] = useState({ items: [], total: 0, loading: true, error: null });
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (debouncedQ !== qParam) {
      const next = new URLSearchParams(params);
      if (!debouncedQ) next.delete('q');
      else next.set('q', debouncedQ);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useEffect(() => {
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    setPage(1);
    api
      .getResearch({ page: 1, pageSize: 12, q: debouncedQ }, ac.signal)
      .then((data) =>
        setState({ items: data.items || [], total: data.total || 0, loading: false, error: null })
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const loadMore = () => {
    const next = page + 1;
    setState((s) => ({ ...s, loading: true }));
    api
      .getResearch({ page: next, pageSize: 12, q: debouncedQ })
      .then((data) =>
        setState((s) => ({ ...s, items: [...s.items, ...(data.items || [])], total: data.total || s.total, loading: false }))
      )
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
    setPage(next);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        label="arXiv tracker"
        title="AI Research"
        icon={FileText}
        action={
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-600 tnum sm:block">
            {state.total > 0 ? `${state.total} papers` : ''}
          </span>
        }
      />

      <div className="relative max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search papers by title, author, abstract or tag…"
          aria-label="Search research papers"
          className="h-10 w-full border border-line bg-surface pl-10 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/50"
        />
      </div>

      <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
        Fresh cs.AI / cs.LG submissions are ingested automatically from the arXiv API every 15 minutes.
      </p>

      {state.error ? (
        <ErrorState message={state.error} />
      ) : state.loading && state.items.length === 0 ? (
        <SkeletonGrid count={6} />
      ) : state.items.length === 0 ? (
        <EmptyState title="No papers match" message="Try a different search term." icon={FileText} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.items.map((p, i) => (
              <PaperCard key={p.id} paper={p} index={i % 12} />
            ))}
          </div>
          <LoadMore
            onClick={loadMore}
            loading={state.loading}
            hasMore={state.items.length < state.total}
            loaded={state.items.length}
            total={state.total}
          />
        </>
      )}
    </div>
  );
}
