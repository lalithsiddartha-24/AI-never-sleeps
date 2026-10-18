import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cpu, ArrowSquareOut as ExternalLink, MagnifyingGlass as Search, X } from '@phosphor-icons/react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { ModelCard } from '../components/ModelCard';
import { Badge } from '../components/Chips';
import { NewsCard } from '../components/NewsCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { LoadMore } from '../components/LoadMore';
import { useDebounce } from '../hooks/useCommon';
import { compactNumber, formatDate, parseList } from '../utils';

const MODEL_TYPES = ['LLM', 'Multimodal', 'Vision', 'Image', 'Video', 'Audio', 'Embedding', 'Speech', 'Robotics'];

export default function Models() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const openSource = params.get('openSource') === '1';
  const qParam = params.get('q') || '';

  const [query, setQuery] = useState(qParam);
  const debouncedQ = useDebounce(query, 300);
  const [state, setState] = useState({ items: [], total: 0, loading: true, error: null });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ loading: false, data: null });

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
      .getModels({ page: 1, pageSize: 24, type, openSource: openSource ? 1 : '', q: debouncedQ }, ac.signal)
      .then((data) =>
        setState({ items: data.items || [], total: data.total || 0, loading: false, error: null })
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, openSource, debouncedQ]);

  const loadMore = () => {
    const next = page + 1;
    setState((s) => ({ ...s, loading: true }));
    api
      .getModels({ page: next, pageSize: 24, type, openSource: openSource ? 1 : '', q: debouncedQ })
      .then((data) =>
        setState((s) => ({ ...s, items: [...s.items, ...(data.items || [])], total: data.total || s.total, loading: false }))
      )
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
    setPage(next);
  };

  const openModel = (model) => {
    setSelected(model);
    setDetail({ loading: true, data: null });
    api
      .getModel(model.slug)
      .then((data) => setDetail({ loading: false, data }))
      .catch(() => setDetail({ loading: false, data: null }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Database"
        title="AI Models"
        icon={Cpu}
        action={
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-600 tnum sm:block">
            {state.total > 0 ? `${state.total} models` : ''}
          </span>
        }
      />

      <div className="relative max-w-xl">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models by name, developer or description…"
          aria-label="Search models"
          className="h-10 w-full border border-line bg-surface pl-10 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MODEL_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => updateParam('type', type === t ? '' : t, '')}
            className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              type === t
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-line bg-surface text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {t}
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
      </div>

      {state.error ? (
        <ErrorState message={state.error} />
      ) : state.loading && state.items.length === 0 ? (
        <SkeletonGrid count={8} />
      ) : state.items.length === 0 ? (
        <EmptyState title="No models match" message="Try a different type or clear the search." icon={Cpu} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {state.items.map((m, i) => (
              <ModelCard key={m.id} model={m} index={i % 12} onSelect={openModel} />
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

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto border border-line bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-50">{selected.name}</h2>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                  {selected.developer} · {selected.model_type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {selected.description && (
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">{selected.description}</p>
            )}

            <dl className="mt-5 grid grid-cols-2 gap-px border border-line bg-line font-mono text-[11px] sm:grid-cols-3">
              <Field label="Released" value={formatDate(selected.release_date)} />
              <Field label="Context" value={selected.context_length ? compactNumber(selected.context_length) : '—'} />
              <Field label="Open source" value={selected.open_source === 1 ? 'Yes' : 'No'} />
              <Field label="API" value={selected.api_available === 1 ? 'Available' : 'Unavailable'} />
              <Field label="Modalities" value={parseList(selected.modalities).join(', ') || '—'} />
              <Field label="Type" value={selected.model_type} />
            </dl>

            {selected.pricing_notes && (
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Pricing</p>
                <p className="mt-1 text-xs text-zinc-300">{selected.pricing_notes}</p>
              </div>
            )}
            {selected.benchmark_notes && (
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Benchmarks</p>
                <p className="mt-1 text-xs text-zinc-300">{selected.benchmark_notes}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {selected.official_url && (
                <a
                  href={selected.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-accent px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:opacity-90"
                >
                  Official page <ExternalLink size={12} />
                </a>
              )}
              <Badge tone={selected.open_source === 1 ? 'green' : 'neutral'}>
                {selected.open_source === 1 ? 'Open' : 'Closed'}
              </Badge>
            </div>

            {detail.loading && <p className="mt-5 font-mono text-[10px] uppercase tracking-wider text-zinc-600">Loading news…</p>}
            {detail.data?.news?.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Latest news
                </p>
                <div className="news-card-masonry">
                  {detail.data.news.slice(0, 4).map((a, i) => (
                    <NewsCard key={a.id} article={a} index={i} dense />
                  ))}
                </div>
              </div>
            )}
            {detail.data && detail.data.news?.length === 0 && (
              <p className="mt-4 border-t border-line pt-4 text-xs text-zinc-600">
                No aggregated news mentions this model yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">{label}</dt>
      <dd className="mt-0.5 text-zinc-200 tnum">{value}</dd>
    </div>
  );
}
