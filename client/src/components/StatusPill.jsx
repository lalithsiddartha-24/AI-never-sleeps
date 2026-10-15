import { offerStatus } from '../utils';

const TONE_CLS = {
  green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  accent: 'border-accent/30 bg-accent/10 text-accent',
  neutral: 'border-line bg-surface2 text-zinc-400',
  red: 'border-red-400/25 bg-red-400/10 text-red-300',
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
