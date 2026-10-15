import { useEffect, useState } from 'react';
import { Building2, Search } from 'lucide-react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { CompanyCard } from '../components/CompanyCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { useDebounce } from '../hooks/useCommon';

export default function Companies() {
  const [query, setQuery] = useState('');
  const debouncedQ = useDebounce(query, 300);
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .getCompanies(debouncedQ, ac.signal)
      .then((data) => setState({ items: data.items || [], loading: false, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => ac.abort();
  }, [debouncedQ]);

  return (
    <div className="space-y-6">
      <SectionHeader
        label="Ecosystem map"
        title="AI Companies"
        icon={Building2}
        action={
          <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-600 tnum sm:block">
            {state.items.length > 0 ? `${state.items.length} tracked` : ''}
          </span>
        }
      />

      <div className="relative max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies…"
          aria-label="Search companies"
          className="h-10 w-full border border-line bg-surface pl-10 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/50"
        />
      </div>

      {state.error ? (
        <ErrorState message={state.error} />
      ) : state.loading ? (
        <SkeletonGrid count={8} />
      ) : state.items.length === 0 ? (
        <EmptyState title="No companies match" icon={Building2} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {state.items.map((c, i) => (
            <CompanyCard key={c.id} company={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
