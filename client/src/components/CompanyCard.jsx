import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, ExternalLink, MapPin } from 'lucide-react';
import { Monogram } from './Monogram';
import { Tag } from './Chips';
import { parseList } from '../utils';

export function CompanyCard({ company, index = 0 }) {
  if (!company) return null;
  const areas = parseList(company.focus_areas).slice(0, 4);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
      className="group flex h-full flex-col gap-3 border border-line bg-surface p-4 transition-colors hover:border-zinc-600/60"
    >
      <div className="flex items-start gap-3">
        <Monogram name={company.name} logoUrl={company.logo_url} size="lg" />
        <div className="min-w-0 flex-1">
          <Link to={`/companies/${company.slug}`} className="block">
            <h3 className="truncate text-sm font-semibold text-zinc-100 transition-colors group-hover:text-accent">
              {company.name}
            </h3>
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-zinc-500">
            {company.founded && <span className="tnum">Est. {company.founded}</span>}
            {company.hq && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin size={9} /> {company.hq}
              </span>
            )}
          </div>
        </div>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${company.name} website`}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-line bg-surface2/60 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      {company.description && (
        <p className="clamp-3 text-xs leading-relaxed text-zinc-400">{company.description}</p>
      )}
      {areas.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-line pt-2.5">
          {areas.map((a) => (
            <Tag key={a}>{a}</Tag>
          ))}
        </div>
      )}
      {!company.description && areas.length === 0 && (
        <span className="mt-auto inline-flex items-center gap-1 border-t border-line pt-2.5 font-mono text-[10px] text-zinc-600">
          <Building2 size={10} /> View profile
        </span>
      )}
    </motion.div>
  );
}
