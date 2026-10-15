import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot } from 'lucide-react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { NewsCard } from '../components/NewsCard';
import { ToolCard } from '../components/ToolCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { useLiveUpdates } from '../hooks/useLiveUpdates';

export default function Agents() {
  const [news, setNews] = useState({ items: [], loading: true, error: null });
  const [tools, setTools] = useState({ items: [], loading: true, error: null });
  const { refreshKey } = useLiveUpdates();

  useEffect(() => {
    const ac = new AbortController();
    setNews((s) => ({ ...s, loading: true }));
    setTools((s) => ({ ...s, loading: true }));
    api
      .getNews({ category: 'AI Agents', pageSize: 9, clustered: 1 }, ac.signal)
      .then((data) => setNews({ items: data.items || [], loading: false, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setNews((s) => ({ ...s, loading: false, error: err.message }));
      });
    api
      .getTools({ category: 'AI Agents', pageSize: 8, sort: 'featured' }, ac.signal)
      .then((data) => setTools({ items: data.items || [], loading: false, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setTools((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => ac.abort();
  }, [refreshKey]);

  return (
    <div className="space-y-12">
      <section className="border border-line bg-surface px-6 py-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">Agentic AI</p>
        <h1 className="mt-2 text-2xl font-extrabold uppercase tracking-tight text-zinc-50 sm:text-3xl">
          AI Agents Hub
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Autonomous agents, agent frameworks, browser agents and coding agents — the latest
          releases and the tools developers are shipping with.
        </p>
      </section>

      <section>
        <SectionHeader
          label="Releases & developments"
          title="Agent News"
          icon={Bot}
          action={
            <Link
              to="/news?category=AI%20Agents"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent"
            >
              All agent news <ArrowRight size={12} />
            </Link>
          }
        />
        {news.error ? (
          <ErrorState message={news.error} />
        ) : news.loading ? (
          <SkeletonGrid count={6} />
        ) : news.items.length === 0 ? (
          <EmptyState compact title="No agent news yet" />
        ) : (
          <div className="news-card-masonry">
            {news.items.map((a, i) => (
              <NewsCard key={a.id} article={a} index={i} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          label="Frameworks & products"
          title="Agent Tools"
          icon={Bot}
          action={
            <Link
              to="/tools?category=AI%20Agents"
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent"
            >
              Browse all <ArrowRight size={12} />
            </Link>
          }
        />
        {tools.error ? (
          <ErrorState message={tools.error} />
        ) : tools.loading ? (
          <SkeletonGrid count={4} />
        ) : tools.items.length === 0 ? (
          <EmptyState compact title="No agent tools indexed" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.items.map((t, i) => (
              <ToolCard key={t.id} tool={t} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
