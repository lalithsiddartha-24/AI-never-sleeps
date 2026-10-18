import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Buildings as Building2, ArrowSquareOut as ExternalLink, MapPin } from '@phosphor-icons/react';
import api from '../api';
import { Monogram } from '../components/Monogram';
import { Tag } from '../components/Chips';
import { NewsCard } from '../components/NewsCard';
import { ToolCard } from '../components/ToolCard';
import { ModelCard } from '../components/ModelCard';
import { PaperCard } from '../components/PaperCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { formatDate, parseList } from '../utils';

const TABS = [
  { key: 'news', label: 'Latest News' },
  { key: 'tools', label: 'Tools' },
  { key: 'models', label: 'Models' },
  { key: 'research', label: 'Research' },
];

export default function CompanyPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [tab, setTab] = useState('news');

  useEffect(() => {
    const ac = new AbortController();
    setState({ loading: true, data: null, error: null });
    setTab('news');
    api
      .getCompany(slug, ac.signal)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError')
          setState({ loading: false, data: null, error: err.status === 404 ? 'Company not found.' : err.message });
      });
    return () => ac.abort();
  }, [slug]);

  if (state.loading) return <div className="py-8"><SkeletonGrid count={6} /></div>;
  if (state.error) {
    return (
      <div className="py-10">
        <ErrorState message={state.error} />
        <div className="mt-4 text-center">
          <Link to="/companies" className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-accent hover:underline">
            <ArrowLeft size={13} /> All companies
          </Link>
        </div>
      </div>
    );
  }

  const { company, news, tools, models, research } = state.data;
  const areas = parseList(company.focus_areas);
  const counts = { news: news?.length || 0, tools: tools?.length || 0, models: models?.length || 0, research: research?.length || 0 };
  const firstNews = news?.[0];

  return (
    <div className="space-y-8">
      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-accent"
      >
        <ArrowLeft size={12} /> All companies
      </Link>

      {/* Overview */}
      <section className="border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Monogram name={company.name} logoUrl={company.logo_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{company.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {company.founded && <span className="tnum">Founded {company.founded}</span>}
              {company.hq && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={10} /> {company.hq}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Building2 size={10} /> {counts.tools} tools · {counts.models} models
              </span>
            </div>
          </div>
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-line bg-surface2 px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider text-zinc-200 transition-colors hover:border-accent/40 hover:text-accent"
            >
              Website <ExternalLink size={12} />
            </a>
          )}
        </div>
        {company.description && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300">{company.description}</p>
        )}
        {areas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {areas.map((a) => (
              <Tag key={a}>{a}</Tag>
            ))}
          </div>
        )}
        {firstNews && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Latest</p>
            <Link to={`/news/${firstNews.slug}`} className="mt-1 block text-sm font-semibold text-zinc-100 hover:text-accent">
              {firstNews.title}
            </Link>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-500">
              {firstNews.source_name} · {formatDate(firstNews.published_at)}
            </p>
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-zinc-500 hover:text-zinc-200'
            }`}
          >
            {t.label} <span className="tnum text-[9px] text-zinc-600">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {tab === 'news' &&
        (counts.news ? (
          <div className="news-card-masonry">
            {news.map((a, i) => (
              <NewsCard key={a.id} article={a} index={i % 12} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="No news yet" message={`No aggregated stories mention ${company.name}.`} />
        ))}

      {tab === 'tools' &&
        (counts.tools ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((t, i) => (
              <ToolCard key={t.id} tool={t} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="No tools indexed" />
        ))}

      {tab === 'models' &&
        (counts.models ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {models.map((m, i) => (
              <ModelCard key={m.id} model={m} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="No models indexed" />
        ))}

      {tab === 'research' &&
        (counts.research ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {research.map((p, i) => (
              <PaperCard key={p.id} paper={p} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState compact title="No papers indexed" message="Papers linked to this company appear here automatically from arXiv ingestion." />
        ))}
    </div>
  );
}
