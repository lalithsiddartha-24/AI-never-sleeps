import { motion } from 'framer-motion';
import { Cpu, ExternalLink } from 'lucide-react';
import { Badge } from './Chips';
import { BookmarkButton } from './BookmarkButton';
import { compactNumber, formatDate, parseList } from '../utils';

export function ModelCard({ model, index = 0, onSelect }) {
  if (!model) return null;
  const modalities = parseList(model.modalities).slice(0, 3);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
      className="group flex h-full flex-col gap-2.5 border border-line bg-surface p-4 transition-colors hover:border-zinc-600/60"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line bg-surface2 text-accent">
          <Cpu size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onSelect && onSelect(model)}
            className="block w-full truncate text-left text-sm font-semibold text-zinc-100 transition-colors group-hover:text-accent"
          >
            {model.name}
          </button>
          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {model.developer || 'Unknown developer'}
          </p>
        </div>
        <BookmarkButton itemType="model" itemId={model.id} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {model.model_type && <Badge tone="accent">{model.model_type}</Badge>}
        <Badge tone={model.open_source === 1 ? 'green' : 'neutral'}>
          {model.open_source === 1 ? 'Open' : 'Closed'}
        </Badge>
        {model.api_available === 1 && <Badge>API</Badge>}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-zinc-500 tnum">
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-600">Released</dt>
          <dd>{model.release_date ? formatDate(model.release_date) : '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-600">Context</dt>
          <dd>{model.context_length ? compactNumber(model.context_length) : '—'}</dd>
        </div>
      </dl>
      {modalities.length > 0 && (
        <p className="truncate font-mono text-[10px] text-zinc-500">
          {modalities.join(' · ')}
        </p>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-line pt-2.5">
        <span className="clamp-1 max-w-[70%] truncate text-[11px] text-zinc-500">
          {model.description || model.pricing_notes || ''}
        </span>
        {model.official_url && (
          <a
            href={model.official_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${model.name} official link`}
            className="inline-flex h-6 w-6 items-center justify-center border border-line bg-surface2/60 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
    </motion.div>
  );
}
