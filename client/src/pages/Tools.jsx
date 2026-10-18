import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlass as Search, Wrench } from '@phosphor-icons/react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { ToolCard } from '../components/ToolCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { LoadMore } from '../components/LoadMore';
import { useDebounce } from '../hooks/useCommon';
import { TOOL_CATEGORIES } from '../utils';

const PRICING_OPTIONS = ['Free', 'Freemium', 'Paid', 'Open Source'];
const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'name', label: 'A–Z' },
  { key: 'updated', label: 'Recently updated' },
];

export default function Tools() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const pricing = params.get('pricing') || '';
  const openSource = params.get('openSource') === '1';
  const sort = SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'featured';
  const qParam = params.get('q') || '';

  const [query, setQuery] = useState(qParam);
  const debouncedQ = useDebounce(query, 300);

  const [state, setState] = useState({ items: [], total: 0, categories: [], loading: true, error: null });
  const [page, setPage] = useState(1);

  const updateParam = (key, value, def) => {
    const next = new URLSearchParams(params);
    if (!value || value === def) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debouncedQ !== qParam) updateParam('q', debouncedQ, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  useEffect(() => {
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    setPage(1);
    api
      .getTools(
        {
          page: 1,
          pageSize: 24,
          category,
          pricing,
          openSource: openSource ? 1 : '',
          q: debouncedQ,
          sort,
        },
        ac.signal
      )
      .then((data) =>
        setState({
          items: data.items || [],
          total: data.total || 0,
          categories: data.categories || [],
          loading: false,
          error: null,
        })
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, pricing, openSource, sort, debouncedQ]);

  const loadMore = () => {
    const next = page + 1;
    setState((s) => ({ ...s, loading: true }));
    api
      .getTools({ page: next, pageSize: 24, category, pricing, openSource: openSource ? 1 : '', q: debouncedQ, sort })
      .then((data) =>
        setState((s) => ({ ...s, items: [...s.items, ...(data.items || [])], total: data.total || s.total, loading: false }))
      )
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
    setPage(next);
  };

  const countFor = (cat) => state.categories.find((c) => c.category === cat)?.count || 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Directory"
        title="AI Tools"
        icon={Wrench}
        action={
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-600 tnum sm:block">
            {state.total > 0 ? `${state.total} tools` : ''}
          </span>
        }
      />

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search AI tools, models, agents…"
          aria-label="Search tools"
          className="h-12 w-full border border-line bg-surface pl-11 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/50"
        />
      </div>

      {/* Category nav — horizontally scrollable on mobile */}
      <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <CatPill label="All" active={!category} onClick={() => updateParam('category', '', '')} />
        {TOOL_CATEGORIES.map((cat) => (
          <CatPill
            key={cat}
            label={cat}
            count={countFor(cat)}
            active={category === cat}
            onClick={() => updateParam('category', category === cat ? '' : cat, '')}
          />
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        {PRICING_OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => updateParam('pricing', pricing === p ? '' : p, '')}
            className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              pricing === p
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-line bg-surface text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {p}
          </button>
        ))}
        <label className="inline-flex cursor-pointer items-center gap-1.5 border border-line bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          <input
            type="checkbox"
            checked={openSource}
            onChange={(e) => updateParam('openSource', e.target.checked ? '1' : '', '')}
            className="h-3 w-3 accent-[var(--color-accent)]"
          />
          Open source only
        </label>
        <div className="ml-auto flex items-center gap-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => updateParam('sort', s.key, 'featured')}
              className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                sort === s.key
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-line bg-surface text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {state.error ? (
        <ErrorState message={state.error} />
      ) : state.loading && state.items.length === 0 ? (
        <SkeletonGrid count={8} />
      ) : state.items.length === 0 ? (
        <EmptyState
          title="No tools match your filters"
          message="Try clearing the search or choosing a different category."
          icon={Wrench}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {state.items.map((t, i) => (
              <ToolCard key={t.id} tool={t} index={i % 12} />
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

function CatPill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'border-line bg-surface text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {label}
      {count != null && count > 0 && (
        <span className={`tnum text-[9px] ${active ? 'text-accent/70' : 'text-zinc-600'}`}>{count}</span>
      )}
    </button>
  );
}
