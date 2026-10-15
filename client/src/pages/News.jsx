import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { FilterBar } from '../components/FilterBar';
import { NewsListItem } from '../components/NewsCard';
import { LiveUpdatePill } from '../components/LiveUpdatePill';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { LoadMore } from '../components/LoadMore';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
import { NEWS_CATEGORIES } from '../utils';

const SORTS = [
  { key: 'published_at', label: 'Latest' },
  { key: 'importance', label: 'Importance' },
];

export default function News() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const sort = SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'published_at';
  const clustered = params.get('clustered') !== '0';

  const [feed, setFeed] = useState({ items: [], total: 0, loading: true, error: null });
  const [page, setPage] = useState(1);
  const { newCount, lastUpdate, updatedAt, consumeUpdates, refreshKey } = useLiveUpdates();

  const updateParam = (key, value, def) => {
    const next = new URLSearchParams(params);
    if (!value || value === def) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    const ac = new AbortController();
    setFeed((f) => ({ ...f, loading: true, error: null }));
    setPage(1);
    api
      .getNews({ page: 1, pageSize: 12, category, sort, clustered: clustered ? 1 : '' }, ac.signal)
      .then((data) =>
        setFeed({ items: data.items || [], total: data.total || 0, loading: false, error: null })
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setFeed((f) => ({ ...f, loading: false, error: err.message }));
      });
    return () => ac.abort();
  }, [category, sort, clustered, refreshKey]);

  const loadMore = () => {
    const next = page + 1;
    setFeed((f) => ({ ...f, loading: true }));
    api
      .getNews({ page: next, pageSize: 12, category, sort, clustered: clustered ? 1 : '' })
      .then((data) =>
        setFeed((f) => ({
          items: [...f.items, ...(data.items || [])],
          total: data.total || f.total,
          loading: false,
        }))
      )
      .catch((err) => setFeed((f) => ({ ...f, loading: false, error: err.message })));
    setPage(next);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Real-time feed"
        title="AI News"
        icon={Newspaper}
        action={
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-600 sm:block tnum">
            {feed.total > 0 ? `${feed.total} stories` : ''}
            {lastUpdate ? ` · synced ${new Date(lastUpdate).toLocaleTimeString()}` : ''}
          </span>
        }
      />

      <div className="space-y-3">
        <FilterBar
          options={NEWS_CATEGORIES.filter((c) => c !== 'Uncategorized')}
          value={category}
          onChange={(v) => updateParam('category', v, '')}
          colored
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => updateParam('sort', s.key, 'published_at')}
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
          <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <input
              type="checkbox"
              checked={clustered}
              onChange={(e) => updateParam('clustered', e.target.checked ? '' : '0', '')}
              className="h-3 w-3 accent-[var(--color-accent)]"
            />
            Group duplicate coverage
          </label>
        </div>
      </div>

      {feed.error ? (
        <ErrorState message={feed.error} />
      ) : feed.loading && feed.items.length === 0 ? (
        <SkeletonGrid count={9} />
      ) : feed.items.length === 0 ? (
        <EmptyState
          title="No stories match this filter"
          message="Try a different category, or wait for the next ingestion run (every 15 minutes)."
        />
      ) : (
        <>
          <div className="overflow-hidden border border-line bg-surface">
            {feed.items.map((a, i) => (
              <NewsListItem key={a.id} article={a} index={i} />
            ))}
          </div>
          <LoadMore
            onClick={loadMore}
            loading={feed.loading}
            hasMore={feed.items.length < feed.total}
            loaded={feed.items.length}
            total={feed.total}
          />
        </>
      )}

      <LiveUpdatePill
        newCount={newCount}
        onClick={consumeUpdates}
        updatedAt={updatedAt}
        lastUpdate={lastUpdate}
      />
    </div>
  );
}
