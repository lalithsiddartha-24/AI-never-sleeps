import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowSquareOut as ExternalLink, Stack as Layers, Lightbulb, Sparkle as Sparkles } from '@phosphor-icons/react';
import api from '../api';
import { CategoryChip, ImportanceMeter, Tag } from '../components/Chips';
import { Monogram, Thumbnail } from '../components/Monogram';
import { BookmarkButton } from '../components/BookmarkButton';
import { NewsCard } from '../components/NewsCard';
import { SkeletonText } from '../components/Skeletons';
import { ErrorState } from '../components/StateBlocks';
import { formatDateTime, parseList, timeAgo } from '../utils';

export default function ArticlePage() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    const ac = new AbortController();
    setState({ loading: true, data: null, error: null });
    api
      .getArticle(slug, ac.signal)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError')
          setState({ loading: false, data: null, error: err.status === 404 ? 'Article not found.' : err.message });
      });
    return () => ac.abort();
  }, [slug]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-8">
        <SkeletonText lines={2} />
        <SkeletonText lines={6} />
      </div>
    );
  }
  if (state.error) {
    return (
      <div className="py-10">
        <ErrorState message={state.error} />
        <div className="mt-4 text-center">
          <Link to="/news" className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-accent hover:underline">
            <ArrowLeft size={13} /> Back to news
          </Link>
        </div>
      </div>
    );
  }

  const a = state.data;
  const tags = parseList(a.tags);
  const takeaways = parseList(a.key_takeaways);
  const coverage = (a.cluster?.coverage || []).filter((m) => m.id !== a.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/news"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-accent"
      >
        <ArrowLeft size={12} /> Back to feed
      </Link>

      <article className="border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
          <CategoryChip category={a.category} />
          <ImportanceMeter importance={a.importance} />
          <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            {a.is_seed === 1 ? 'Seed story' : 'Aggregated'}
          </span>
        </div>

        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
            {a.title}
          </h1>

          {/* Source transparency block */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border border-line bg-surface2/50 px-4 py-3">
            <Monogram name={a.source_name} logoUrl={a.source_logo_url} size="md" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-200">
                Source: {a.source_name || 'Unknown'}
              </p>
              <p className="font-mono text-[10px] text-zinc-500 tnum">
                Published {timeAgo(a.published_at)} · {formatDateTime(a.published_at)}
                {a.author ? ` · ${a.author}` : ''}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <BookmarkButton itemType="news" itemId={a.id} />
              {a.source_url && (
                <a
                  href={a.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-accent px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
                >
                  Read Original <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {a.image_url && (
            <div className="mt-5">
              <Thumbnail src={a.image_url} alt={a.title} ratio="aspect-[21/9]" />
            </div>
          )}

          {a.summary && (
            <section className="mt-6">
              <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                <Sparkles size={11} /> AI-generated summary
              </p>
              <p className="text-[15px] leading-relaxed text-zinc-200">{a.summary}</p>
            </section>
          )}

          {takeaways.length > 0 && (
            <section className="mt-6 border-l-2 border-accent/50 bg-surface2/40 px-5 py-4">
              <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                Key takeaways
              </h2>
              <ul className="space-y-1.5">
                {takeaways.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {a.why_it_matters && (
            <section className="mt-6">
              <h2 className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                <Lightbulb size={11} className="text-amber-700" /> Why it matters
              </h2>
              <p className="text-sm leading-relaxed text-zinc-300">{a.why_it_matters}</p>
            </section>
          )}

          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Tag key={t}>#{t}</Tag>
              ))}
            </div>
          )}

          <p className="mt-6 border-t border-line pt-4 font-mono text-[10px] leading-relaxed text-zinc-600">
            This page aggregates metadata and an AI-generated summary grounded in the original
            article. All reporting credit belongs to {a.source_name || 'the original source'}.
          </p>
        </div>
      </article>

      {coverage.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
            <Layers size={13} className="text-accent" /> More coverage ({coverage.length})
          </h2>
          <div className="divide-y divide-line border border-line bg-surface">
            {coverage.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Monogram name={m.source_name} logoUrl={m.source_logo_url} />
                <Link to={`/news/${m.slug}`} className="min-w-0 flex-1">
                  <p className="clamp-1 text-xs font-medium text-zinc-200 hover:text-accent">{m.title}</p>
                  <p className="font-mono text-[10px] text-zinc-500">
                    {m.source_name} · {timeAgo(m.published_at)}
                  </p>
                </Link>
                <a
                  href={m.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Read original"
                  className="text-zinc-500 hover:text-zinc-200"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {a.related?.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
            Related in {a.category}
          </h2>
          <div className="news-card-masonry">
            {a.related.slice(0, 4).map((r, i) => (
              <NewsCard key={r.id} article={r} index={i} dense />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
