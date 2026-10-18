import { useEffect, useState } from 'react';
import { BookmarkSimple as Bookmark, Cpu, FileText, GraduationCap, Newspaper, Wrench } from '@phosphor-icons/react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { NewsCard } from '../components/NewsCard';
import { ToolCard } from '../components/ToolCard';
import { OfferCard } from '../components/OfferCard';
import { ModelCard } from '../components/ModelCard';
import { PaperCard } from '../components/PaperCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { useBookmarks } from '../hooks/useBookmarks';

const SECTIONS = [
  { key: 'news', label: 'Saved News', icon: Newspaper },
  { key: 'tools', label: 'Saved Tools', icon: Wrench },
  { key: 'offers', label: 'Saved Offers', icon: GraduationCap },
  { key: 'models', label: 'Saved Models', icon: Cpu },
  { key: 'research', label: 'Saved Papers', icon: FileText },
];

export default function Bookmarks() {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const { count } = useBookmarks();

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .getBookmarks()
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => setState({ loading: false, data: null, error: err.message }));
  };

  useEffect(load, [count]);

  const total = state.data ? SECTIONS.reduce((sum, s) => sum + (state.data[s.key]?.length || 0), 0) : 0;

  return (
    <div className="space-y-10">
      <SectionHeader
        label="Personal library"
        title="Bookmarks"
        icon={Bookmark}
        action={
          <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 tnum">
            {total} saved
          </span>
        }
      />

      {state.error && <ErrorState message={state.error} onRetry={load} />}
      {state.loading && <SkeletonGrid count={4} />}

      {state.data && total === 0 && (
        <EmptyState
          title="Nothing saved yet"
          message="Use the bookmark button on any news story, tool, model or paper to build your personal library."
          icon={Bookmark}
        />
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
              <div
                className={`grid grid-cols-1 gap-4 ${
                  key === 'news' || key === 'research'
                    ? 'md:grid-cols-2 xl:grid-cols-3'
                    : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}
              >
                {items.map((item, i) => {
                  if (key === 'news') return <NewsCard key={item.id} article={item} index={i} />;
                  if (key === 'tools') return <ToolCard key={item.id} tool={item} index={i} />;
                  if (key === 'offers') return <OfferCard key={item.id} offer={item} index={i} />;
                  if (key === 'models') return <ModelCard key={item.id} model={item} index={i} />;
                  return <PaperCard key={item.id} paper={item} index={i} />;
                })}
              </div>
            </section>
          );
        })}
    </div>
  );
}
