import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Gift,
  Globe,
  GraduationCap,
  Info,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import api from '../api';
import { Badge, CategoryChip, Tag } from '../components/Chips';
import { Monogram } from '../components/Monogram';
import { BookmarkButton } from '../components/BookmarkButton';
import { StatusPill } from '../components/StatusPill';
import { OfferCard } from '../components/OfferCard';
import { SkeletonText } from '../components/Skeletons';
import { ErrorState } from '../components/StateBlocks';
import { formatDate, parseList, toISO } from '../utils';

function Row({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line/60 py-2.5 last:border-0 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-xs leading-relaxed text-zinc-300">{children}</dd>
    </div>
  );
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="border border-line bg-surface p-5">
      <h2 className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
        <Icon size={12} className="text-accent" /> {title}
      </h2>
      {children}
    </section>
  );
}

export default function StudentOfferPage() {
  const { slug } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    const ac = new AbortController();
    setState({ loading: true, data: null, error: null });
    api
      .getStudentOffer(slug, ac.signal)
      .then((data) => setState({ loading: false, data, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError')
          setState({ loading: false, data: null, error: err.status === 404 ? 'Offer not found.' : err.message });
      });
    return () => ac.abort();
  }, [slug, setState]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
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
          <Link to="/student-offers" className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-accent hover:underline">
            <ArrowLeft size={13} /> Back to student offers
          </Link>
        </div>
      </div>
    );
  }

  const { offer, related } = state.data;
  const steps = parseList(offer.how_to_claim);
  const tags = parseList(offer.tags);
  const discount = Number(offer.discount_percentage) > 0 ? Number(offer.discount_percentage) : null;
  const org = offer.tool_name || offer.company_name || 'Offer';

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        to="/student-offers"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-accent"
      >
        <ArrowLeft size={12} /> All student offers
      </Link>

      {/* Overview header */}
      <section className="border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Monogram name={org} logoUrl={offer.logo_url} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {offer.company_name || org}
              {offer.tool_name && offer.company_name ? ` · ${offer.tool_name}` : ''}
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-zinc-50">{offer.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusPill status={offer.status} />
              <CategoryChip category={offer.category} />
              <Badge tone="neutral">{offer.offer_type}</Badge>
              {offer.is_student_only === 1 ? (
                <Badge tone="accent">Student-only</Badge>
              ) : (
                <Badge tone="amber">Generally available</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton itemType="offer" itemId={offer.id} />
            <a
              href={offer.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
            >
              Claim on Official Website <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {offer.student_benefit && (
          <p className="mt-5 flex items-start gap-2 border-l-2 border-accent/50 bg-accent/[0.05] px-3 py-2.5 text-sm leading-relaxed text-zinc-100">
            <GraduationCap size={15} className="mt-0.5 shrink-0 text-accent" />
            {offer.student_benefit}
          </p>
        )}
        {offer.description && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">{offer.description}</p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* What you get */}
          <Panel icon={Gift} title="What you get">
            <dl>
              <Row label="Student benefit">{offer.student_benefit || 'See official source.'}</Row>
              {offer.free_credits && <Row label="Free credits">{offer.free_credits}</Row>}
              <Row label="Student price">
                {offer.student_price ? (
                  <span className="font-mono text-emerald-300 tnum">{offer.student_price}</span>
                ) : (
                  'Not separately published — see official page.'
                )}
              </Row>
              {offer.regular_price && <Row label="Normal price"><span className="tnum">{offer.regular_price}</span></Row>}
              {discount && <Row label="Discount"><Badge tone="green">{discount}% off (as officially stated)</Badge></Row>}
            </dl>
          </Panel>

          {/* How to claim */}
          <Panel icon={CheckCircle2} title="How to claim">
            {steps.length ? (
              <ol className="space-y-2.5">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-xs leading-relaxed text-zinc-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center border border-accent/40 bg-accent/10 font-mono text-[10px] font-bold text-accent tnum">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-zinc-500">
                Follow the instructions on the official page — we only publish steps supported by the source.
              </p>
            )}
            <a
              href={offer.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 border border-line bg-surface2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent"
            >
              Open official page <ExternalLink size={11} />
            </a>
          </Panel>

          {/* Important conditions */}
          <Panel icon={Info} title="Important conditions">
            <dl>
              {offer.geographic_restrictions && <Row label="Geographic limits">{offer.geographic_restrictions}</Row>}
              <Row label="Expiration">
                {offer.expiration_date ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-300">
                    <CalendarClock size={12} /> {formatDate(toISO(offer.expiration_date))}
                  </span>
                ) : (
                  'No published end date — ongoing program (subject to change by the provider).'
                )}
              </Row>
              {offer.important_conditions && <Row label="Fine print">{offer.important_conditions}</Row>}
            </dl>
          </Panel>
        </div>

        {/* Right rail: eligibility + trust */}
        <div className="space-y-6">
          <Panel icon={UserCheck} title="Eligibility">
            <dl>
              <Row label="Who qualifies">{offer.eligibility || 'See official source.'}</Row>
              <Row label="Verification">{offer.verification_method || 'Not specified.'}</Row>
            </dl>
          </Panel>

          <Panel icon={ShieldCheck} title="Source & trust">
            <dl>
              <Row label="Official source">
                <a
                  href={offer.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all text-accent hover:underline"
                >
                  <Globe size={11} className="shrink-0" />
                  {offer.official_url.replace(/^https?:\/\//, '')}
                </a>
              </Row>
              <Row label="Last verified">
                {offer.last_verified_at ? (
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck size={12} className="text-emerald-400" />
                    {formatDate(toISO(offer.last_verified_at))}
                  </span>
                ) : (
                  <span className="text-zinc-500">Not yet verified</span>
                )}
              </Row>
              <Row label="Benefit type">
                {offer.is_student_only === 1 ? 'Student-only offer' : 'Generally available free tier'}
              </Row>
              <Row label="Status">
                <StatusPill status={offer.status} />
              </Row>
            </dl>
            <p className="mt-3 border-t border-line pt-3 font-mono text-[10px] leading-relaxed text-zinc-600">
              We never fabricate discounts, credits or prices. If a benefit can't be confirmed against the
              official page, it stays marked “Verification Required.”
            </p>
          </Panel>

          {tags.length > 0 && (
            <Panel icon={GraduationCap} title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>

      {/* Related */}
      {related?.length > 0 && (
        <section>
          <h2 className="mb-4 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
            More in {offer.category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 6).map((o, i) => (
              <OfferCard key={o.id} offer={o} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
