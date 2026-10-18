import { offerStatus } from '../utils';

const TONE_CLS = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  accent: 'border-accent/30 bg-accent/10 text-accent',
  neutral: 'border-line bg-surface2 text-zinc-400',
  red: 'border-red-200 bg-red-50 text-red-800',
};

export function StatusPill({ status, className = '' }) {
  const meta = offerStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TONE_CLS[meta.tone]} ${className}`}
      title={meta.label}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
