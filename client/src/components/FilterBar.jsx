import { categoryStyle } from '../utils';

export function FilterBar({ options, value, onChange, allLabel = 'All', colored = false, className = '' }) {
  return (
    <div
      className={`no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 ${className}`}
      role="tablist"
    >
      <FilterPill
        label={allLabel}
        active={!value}
        onClick={() => onChange('')}
      />
      {options.map((opt) => (
        <FilterPill
          key={opt}
          label={opt}
          active={value === opt}
          onClick={() => onChange(value === opt ? '' : opt)}
          dotColor={colored ? categoryStyle(opt).dot : null}
        />
      ))}
    </div>
  );
}

function FilterPill({ label, active, onClick, dotColor }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'border-line bg-surface text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {dotColor && !active && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
      {label}
    </button>
  );
}
