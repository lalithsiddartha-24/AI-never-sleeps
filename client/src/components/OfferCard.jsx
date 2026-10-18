import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SealCheck as BadgeCheck, ArrowSquareOut as ExternalLink, GraduationCap } from '@phosphor-icons/react';
import { Badge, CategoryChip } from './Chips';
import { Monogram } from './Monogram';
import { BookmarkButton } from './BookmarkButton';
import { StatusPill } from './StatusPill';
import { formatDate, toISO } from '../utils';

export function OfferCard({ offer, index = 0 }) {
  if (!offer) return null;
  const discount = Number(offer.discount_percentage) > 0 ? Number(offer.discount_percentage) : null;
  const org = offer.tool_name || offer.company_name || 'Offer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2) }}
      className="group flex h-full flex-col gap-3 border border-line bg-surface p-4 transition-colors hover:border-zinc-600/60"
    >
      <div className="flex items-start gap-3">
        <Monogram name={org} logoUrl={offer.logo_url} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            {offer.company_name || org}
            {offer.tool_name && offer.company_name ? ` · ${offer.tool_name}` : ''}
          </p>
          <Link to={`/student-offers/${offer.slug}`} className="mt-0.5 block">
            <h3 className="clamp-2 text-sm font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-accent">
              {offer.title}
            </h3>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {offer.featured === 1 && <Badge tone="accent">Pick</Badge>}
          <BookmarkButton itemType="offer" itemId={offer.id} />
        </div>
      </div>

      {offer.student_benefit && (
        <p className="flex items-start gap-1.5 border-l-2 border-accent/40 bg-accent/[0.04] px-2.5 py-1.5 text-xs leading-relaxed text-zinc-200">
          <GraduationCap size={13} className="mt-0.5 shrink-0 text-accent" />
          <span className="clamp-2">{offer.student_benefit}</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryChip category={offer.category} />
        <Badge tone="neutral">{offer.offer_type}</Badge>
        {discount && <Badge tone="green">{discount}% off</Badge>}
        {offer.is_student_only === 0 && <Badge tone="amber">Free tier</Badge>}
      </div>

      {(offer.student_price || offer.free_credits) && (
        <p className="font-mono text-[11px] text-zinc-400 tnum">
          {offer.free_credits ? offer.free_credits : offer.student_price}
          {offer.regular_price && (
            <span className="text-zinc-600 line-through"> {offer.regular_price}</span>
          )}
        </p>
      )}

      {offer.eligibility && (
        <p className="clamp-2 text-[11px] leading-relaxed text-zinc-500">
          <span className="font-mono uppercase tracking-wider text-zinc-600">Eligibility: </span>
          {offer.eligibility}
        </p>
      )}

      <div className="mt-auto space-y-2.5 border-t border-line pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <StatusPill status={offer.status} />
          <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
            {offer.last_verified_at
              ? `Verified ${formatDate(toISO(offer.last_verified_at))}`
              : 'Not yet verified'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/student-offers/${offer.slug}`}
            className="flex-1 border border-line bg-surface2 px-2.5 py-1.5 text-center font-mono text-[10px] uppercase tracking-wider text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent"
          >
            View Offer
          </Link>
          <a
            href={offer.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 bg-accent px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
          >
            <BadgeCheck size={11} /> Verify Eligibility
          </a>
        </div>
        <a
          href={offer.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ExternalLink size={9} /> Official source
        </a>
      </div>
    </motion.div>
  );
}
