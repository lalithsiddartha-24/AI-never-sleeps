import { categoryStyle } from '../utils';

export function CategoryChip({ category, className = '' }) {
  const style = categoryStyle(category);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider ${style.chip} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {category || 'Uncategorized'}
    </span>
  );
}

export function ImportanceMeter({ importance = 0, className = '' }) {
  const level = Math.max(0, Math.min(5, Number(importance) || 0));
  return (
    <span className={`inline-flex items-center gap-[3px] ${className}`} title={`Importance ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-[3px] rounded-sm ${
            i <= level ? (level >= 4 ? 'bg-accent' : 'bg-zinc-400') : 'bg-line'
          }`}
          style={{ height: `${4 + i * 2}px` }}
        />
      ))}
    </span>
  );
}

export function Tag({ children, className = '' }) {
  return (
    <span
      className={`inline-block border border-line bg-surface2 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 ${className}`}
    >
      {children}
    </span>
  );
}

export function Badge({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'border-line bg-surface2 text-zinc-400',
    accent: 'border-accent/30 bg-accent/10 text-accent',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    red: 'border-red-200 bg-red-50 text-red-800',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
