import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Cpu, FileText, GraduationCap, Newspaper, Search as SearchIcon, Wrench } from 'lucide-react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { NewsCard } from '../components/NewsCard';
import { ToolCard } from '../components/ToolCard';
import { OfferCard } from '../components/OfferCard';
import { ModelCard } from '../components/ModelCard';
import { PaperCard } from '../components/PaperCard';
import { CompanyCard } from '../components/CompanyCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';

const SECTIONS = [
  { key: 'news', label: 'News', icon: Newspaper },
  { key: 'tools', label: 'Tools', icon: Wrench },
  { key: 'offers', label: 'Offers', icon: GraduationCap },
  { key: 'models', label: 'Models', icon: Cpu },
  { key: 'companies', label: 'Companies', icon: Building2 },
  { key: 'research', label: 'Research', icon: FileText },
];

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [state, setState] = useState({ loading: !!q, data: null, error: null });

  useEffect(() => {
    if (!q) {
      setState({ loading: false, data: null, error: null });
      return undefined;
    }
    const ac = new AbortController();
    setState({ loading: true, data: null, error: null });
    api
      .search(q, 12, ac.signal)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ loading: false, data: null, error: err.message });
      });
    return () => ac.abort();
  }, [q]);

  const total = state.data
    ? SECTIONS.reduce((sum, s) => sum + (state.data[s.key]?.length || 0), 0)
    : 0;

  return (
    <div className="space-y-10">
      <SectionHeader
        label="Global search"
        title={q ? `Results for “${q}”` : 'Search'}
        icon={SearchIcon}
        action={
          state.data ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 tnum">
              {total} matches
            </span>
          ) : null
        }
      />

      {!q && (
        <EmptyState
          title="Search the AI ecosystem"
          message='Try "OpenAI", "coding agents", "free AI credits", "student cloud credits" or "image generation".'
          icon={SearchIcon}
        />
      )}

      {state.error && <ErrorState message={state.error} />}
      {state.loading && <SkeletonGrid count={6} />}

      {state.data && total === 0 && (
        <EmptyState title={`No results for “${q}”`} message="Check the spelling or try a broader term." />
      )}

      {state.data &&
        SECTIONS.map(({ key, label, icon: Icon }) => {
          const items = state.data[key] || [];
          if (!items.length) return null;
          return (
            <section key={key}>
              <h2 className="mb-4 inline-flex items-center gap-2 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                <Icon size={12} className="text-accent" /> {label}
                <span className="tnum text-[10px] text-zinc-600">{items.length}</span>
              </h2>
              {key === 'news' && (
                <div className="news-card-masonry">
                  {items.map((a, i) => (
                    <NewsCard key={a.id} article={a} index={i} />
                  ))}
                </div>
              )}
              {key === 'tools' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((t, i) => (
                    <ToolCard key={t.id} tool={t} index={i} />
                  ))}
                </div>
              )}
              {key === 'offers' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((o, i) => (
                    <OfferCard key={o.id} offer={o} index={i} />
                  ))}
                </div>
              )}
              {key === 'models' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((m, i) => (
                    <ModelCard key={m.id} model={m} index={i} onSelect={() => {}} />
                  ))}
                </div>
              )}
              {key === 'companies' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((c, i) => (
                    <CompanyCard key={c.id} company={c} index={i} />
                  ))}
                </div>
              )}
              {key === 'research' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((p, i) => (
                    <PaperCard key={p.id} paper={p} index={i} />
                  ))}
                </div>
              )}
              {key === 'news' && (
                <Link
                  to={`/news?q=${encodeURIComponent(q)}`}
                  className="mt-3 inline-block font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent"
                >
                  See all news results →
                </Link>
              )}
            </section>
          );
        })}
    </div>
  );
}
