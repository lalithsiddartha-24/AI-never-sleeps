import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink, Layers } from 'lucide-react';
import { CategoryChip, ImportanceMeter, Tag } from './Chips';
import { Monogram, Thumbnail } from './Monogram';
import { BookmarkButton } from './BookmarkButton';
import { parseList, timeAgo } from '../utils';

export function NewsCard({ article, index = 0, showImage = true, dense = false }) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  if (!article) return null;
  const tags = parseList(article.tags).slice(0, 2);
  const cluster = article.cluster || null;
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
      className="group flex h-fit items-stretch border border-line bg-surface transition-colors hover:border-zinc-600/60"
    >
      {showImage && article.image_url && !dense && (
        <Link to={`/news/${article.slug}`} className="w-24 shrink-0 overflow-hidden sm:w-28 lg:w-32">
          <Thumbnail
            src={article.image_url}
            alt={article.title}
            ratio="aspect-square"
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <div className="flex items-center gap-2">
          <CategoryChip category={article.category} />
          <ImportanceMeter importance={article.importance} className="ml-auto" />
        </div>
        <Link to={`/news/${article.slug}`} className="block">
          <h3
            className={`font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent ${
              dense ? 'text-[13px]' : 'text-sm'
            } clamp-2`}
          >
            {article.title}
          </h3>
        </Link>
        {article.summary && (
          <div>
            <p className={`${summaryExpanded ? '' : 'clamp-2'} text-[11px] leading-relaxed text-zinc-400 sm:text-xs`}>
              {article.summary}
            </p>
            {article.summary.length > 140 && (
              <button
                type="button"
                onClick={() => setSummaryExpanded((value) => !value)}
                aria-expanded={summaryExpanded}
                className="mt-1 inline-flex items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-accent"
              >
                {summaryExpanded ? 'Show less' : 'Read summary'}
                <ChevronDown size={12} className={`transition-transform ${summaryExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <Monogram name={article.source_name} logoUrl={article.source_logo_url} />
          <span className="truncate text-[11px] font-medium text-zinc-400">
            {article.source_name || 'Unknown source'}
          </span>
          <span className="font-mono text-[10px] text-zinc-600">·</span>
          <time className="font-mono text-[10px] text-zinc-500 tnum" dateTime={article.published_at}>
            {timeAgo(article.published_at)}
          </time>
          <div className="ml-auto flex items-center gap-1.5">
            {cluster && cluster.count > 1 && (
              <span
                className="inline-flex items-center gap-1 border border-line bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
                title={cluster.sources?.map((s) => s.source_name).join(', ')}
              >
                <Layers size={10} />+{cluster.count - 1} more
              </span>
            )}
            <BookmarkButton itemType="news" itemId={article.id} />
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Read Original"
                aria-label="Read Original"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-7 w-7 items-center justify-center border border-line bg-surface2/60 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function NewsListItem({ article, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  if (!article) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
      className="group flex items-start gap-2.5 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-surface2/50 sm:gap-3 sm:px-4"
    >
      <span className="mt-0.5 hidden w-6 shrink-0 text-right text-[11px] text-zinc-600 tnum sm:block">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <Link to={`/news/${article.slug}`}>
          <h4 className="clamp-2 text-[13px] font-medium leading-snug text-zinc-200 transition-colors group-hover:text-accent sm:text-sm">
            {article.title}
          </h4>
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500 sm:gap-2">
          <span className="truncate">{article.source_name}</span>
          <span>·</span>
          <time className="shrink-0 tnum">{timeAgo(article.published_at)}</time>
          {article.category && (
            <>
              <span>·</span>
              <span className="hidden truncate text-zinc-600 sm:inline">{article.category}</span>
            </>
          )}
        </div>
        {expanded && article.summary && (
          <p className="mt-2 max-w-4xl text-xs leading-relaxed text-zinc-400">{article.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {article.summary && (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide summary' : 'Show summary'}
            title={expanded ? 'Hide summary' : 'Show summary'}
            className="inline-flex h-7 items-center gap-1 px-1.5 text-[10px] text-zinc-500 transition-colors hover:text-accent sm:px-2"
          >
            <span className="hidden sm:inline">{expanded ? 'Less' : 'Summary'}</span>
            <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
        <BookmarkButton itemType="news" itemId={article.id} className="shrink-0" />
      </div>
    </motion.div>
  );
}
