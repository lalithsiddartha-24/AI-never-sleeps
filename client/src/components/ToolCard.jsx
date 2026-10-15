import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Star } from 'lucide-react';
import { Badge, Tag } from './Chips';
import { Monogram } from './Monogram';
import { BookmarkButton } from './BookmarkButton';
import { parseList, timeAgo } from '../utils';

const PRICING_TONE = {
  Free: 'green',
  Freemium: 'accent',
  Paid: 'amber',
  'Open Source': 'green',
};

export function ToolCard({ tool, index = 0 }) {
  if (!tool) return null;
  const tags = parseList(tool.tags).slice(0, 3);
  const rating =
    tool.rating_count > 0 ? (tool.rating_sum / tool.rating_count).toFixed(1) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
      className="group flex h-full flex-col gap-3 border border-line bg-surface p-4 transition-colors hover:border-zinc-600/60"
    >
      <div className="flex items-start gap-3">
        <Monogram name={tool.name} logoUrl={tool.logo_url} size="lg" />
        <div className="min-w-0 flex-1">
          <Link to={`/tools/${tool.slug}`} className="block">
            <h3 className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-accent">
              {tool.name}
            </h3>
          </Link>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {tool.company_name || tool.category}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {tool.featured === 1 && <Badge tone="accent">Featured</Badge>}
          <BookmarkButton itemType="tool" itemId={tool.id} />
        </div>
      </div>
      {tool.description && (
        <p className="clamp-3 text-xs leading-relaxed text-zinc-400">{tool.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={PRICING_TONE[tool.pricing_type] || 'neutral'}>{tool.pricing_type || 'N/A'}</Badge>
        {tool.open_source === 1 && <Badge tone="green">Open Source</Badge>}
        {tool.category && <Badge>{tool.category}</Badge>}
        {rating && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-300 tnum">
            <Star size={10} fill="currentColor" /> {rating}
          </span>
        )}
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <span className="font-mono text-[10px] text-zinc-600">
          {tool.updated_at ? `Updated ${timeAgo(tool.updated_at)}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <Link
            to={`/tools/${tool.slug}`}
            className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-accent"
          >
            Details
          </Link>
          {tool.website && (
            <a
              href={tool.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${tool.name} website`}
              className="inline-flex h-6 w-6 items-center justify-center border border-line bg-surface2/60 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
