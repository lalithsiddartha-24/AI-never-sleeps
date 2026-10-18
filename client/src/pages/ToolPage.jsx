import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowSquareOut as ExternalLink, Monitor, Newspaper, Target, Users } from '@phosphor-icons/react';
import api from '../api';
import { Badge, Tag } from '../components/Chips';
import { Monogram } from '../components/Monogram';
import { BookmarkButton } from '../components/BookmarkButton';
import { ToolCard } from '../components/ToolCard';
import { NewsCard } from '../components/NewsCard';
import { SkeletonText } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { formatDate, parseList } from '../utils';

const BEST_FOR_RULES = [
  { match: ['coding', 'developer infrastructure'], label: 'Developers' },
  { match: ['research'], label: 'Researchers' },
  { match: ['education'], label: 'Students' },
  { match: ['design', 'image generation', 'video generation', '3d & spatial'], label: 'Designers & Creators' },
  { match: ['marketing', 'business'], label: 'Marketing & Business Teams' },
  { match: ['writing', 'productivity', 'audio'], label: 'Knowledge Workers' },
  { match: ['ai agents'], label: 'Automation Builders' },
];

export default function ToolPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    const ac = new AbortController();
    setState({ loading: true, data: null, error: null });
    api
      .getTool(slug, ac.signal)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError')
          setState({ loading: false, data: null, error: err.status === 404 ? 'Tool not found.' : err.message });
      });
    return () => ac.abort();
  }, [slug]);

  const bestFor = useMemo(() => {
    if (!state.data?.tool) return [];
    const cat = (state.data.tool.category || '').toLowerCase();
    const labels = BEST_FOR_RULES.filter((r) => r.match.includes(cat)).map((r) => r.label);
    if (!labels.length) labels.push('General AI Users');
    return labels;
  }, [state.data]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <SkeletonText lines={2} />
        <SkeletonText lines={5} />
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="py-10">
        <ErrorState message={state.error} />
        <div className="mt-4 text-center">
          <Link to="/tools" className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-accent hover:underline">
            <ArrowLeft size={13} /> Back to tools
          </Link>
        </div>
      </div>
    );
  }

  const { tool, alternatives, news } = state.data;
  const capabilities = parseList(tool.capabilities);
  const platforms = parseList(tool.platforms);
  const tags = parseList(tool.tags);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <Link
        to="/tools"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-accent"
      >
        <ArrowLeft size={12} /> All tools
      </Link>

      {/* Overview */}
      <section className="border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Monogram name={tool.name} logoUrl={tool.logo_url} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">{tool.name}</h1>
              {tool.featured === 1 && <Badge tone="accent">Featured</Badge>}
            </div>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              {tool.company_name ? (
                <Link to={`/search?q=${encodeURIComponent(tool.company_name)}`} className="hover:text-accent">
                  {tool.company_name}
                </Link>
              ) : (
                'Independent'
              )}
              {tool.subcategory ? ` · ${tool.subcategory}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton itemType="tool" itemId={tool.id} />
            {tool.website && (
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
              >
                Visit website <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {tool.description && (
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-300">
            {tool.long_description || tool.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge tone={tool.pricing_type === 'Free' || tool.pricing_type === 'Open Source' ? 'green' : tool.pricing_type === 'Paid' ? 'amber' : 'accent'}>
            {tool.pricing_type}
          </Badge>
          {tool.open_source === 1 && <Badge tone="green">Open Source</Badge>}
          <Badge>{tool.category}</Badge>
          {tool.launch_date && (
            <span className="font-mono text-[10px] text-zinc-600">Launched {formatDate(tool.launch_date)}</span>
          )}
          {tool.updated_at && (
            <span className="font-mono text-[10px] text-zinc-600">· Updated {formatDate(tool.updated_at)}</span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Capabilities */}
        <section className="border border-line bg-surface p-5">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            Capabilities
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {capabilities.length ? (
              capabilities.map((c) => <Tag key={c}>{c}</Tag>)
            ) : (
              <p className="text-xs text-zinc-600">Not listed.</p>
            )}
          </div>
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-3">
              {tags.map((t) => (
                <span key={t} className="font-mono text-[10px] text-zinc-600">#{t}</span>
              ))}
            </div>
          )}
        </section>

        {/* Platforms */}
        <section className="border border-line bg-surface p-5">
          <h2 className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            <Monitor size={11} /> Platforms
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {platforms.length ? (
              platforms.map((p) => <Tag key={p}>{p}</Tag>)
            ) : (
              <p className="text-xs text-zinc-600">Not listed.</p>
            )}
          </div>
        </section>

        {/* Best for */}
        <section className="border border-line bg-surface p-5">
          <h2 className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            <Users size={11} /> Best for
          </h2>
          <ul className="space-y-1.5">
            {bestFor.map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs text-zinc-300">
                <Target size={11} className="text-accent" /> {b}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Alternatives */}
      {alternatives?.length > 0 && (
        <section>
          <h2 className="mb-4 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
            Alternatives & similar tools
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {alternatives.slice(0, 4).map((t, i) => (
              <ToolCard key={t.id} tool={t} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Latest news */}
      <section>
        <h2 className="mb-4 inline-flex items-center gap-2 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
          <Newspaper size={12} className="text-accent" /> Latest news about {tool.name}
        </h2>
        {news?.length ? (
          <div className="news-card-masonry">
            {news.slice(0, 6).map((a, i) => (
              <NewsCard key={a.id} article={a} index={i} dense />
            ))}
          </div>
        ) : (
          <EmptyState compact title="No recent news" message={`No aggregated stories mention ${tool.name} yet.`} />
        )}
      </section>
    </div>
  );
}
