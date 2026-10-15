import { motion } from 'framer-motion';
import { ExternalLink, FileText } from 'lucide-react';
import { Badge, Tag } from './Chips';
import { BookmarkButton } from './BookmarkButton';
import { formatDate, parseList, timeAgo } from '../utils';

export function PaperCard({ paper, index = 0 }) {
  if (!paper) return null;
  const authors = parseList(paper.authors);
  const tags = parseList(paper.tags).slice(0, 4);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
      className="group flex h-full flex-col gap-3 border border-line bg-surface p-4 transition-colors hover:border-zinc-600/60"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-line bg-surface2 text-blue-300">
          <FileText size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="clamp-2 text-sm font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent">
            {paper.url ? (
              <a href={paper.url} target="_blank" rel="noopener noreferrer">
                {paper.title}
              </a>
            ) : (
              paper.title
            )}
          </h3>
          <p className="mt-1 clamp-1 text-[11px] text-zinc-500">
            {authors.length > 0
              ? `${authors.slice(0, 3).join(', ')}${authors.length > 3 ? ` +${authors.length - 3}` : ''}`
              : 'Authors unavailable'}
          </p>
        </div>
        <BookmarkButton itemType="research" itemId={paper.id} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {paper.primary_category && <Badge tone="accent">{paper.primary_category}</Badge>}
        <span className="font-mono text-[10px] text-zinc-500 tnum">
          {paper.published_at ? formatDate(paper.published_at) : ''}
          {paper.published_at && <span className="text-zinc-700"> · {timeAgo(paper.published_at)}</span>}
        </span>
        {paper.arxiv_id && (
          <span className="font-mono text-[10px] text-zinc-600">{paper.arxiv_id}</span>
        )}
      </div>
      {(paper.summary || paper.abstract) && (
        <p className="clamp-3 text-xs leading-relaxed text-zinc-400">
          {paper.summary || paper.abstract}
        </p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center gap-3 border-t border-line pt-2.5">
        {paper.url && (
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-accent"
          >
            <ExternalLink size={11} /> arXiv
          </a>
        )}
        {paper.pdf_url && (
          <a
            href={paper.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-accent"
          >
            <ExternalLink size={11} /> PDF
          </a>
        )}
      </div>
    </motion.div>
  );
}
