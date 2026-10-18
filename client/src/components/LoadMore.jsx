import { CircleNotch as Loader2 } from '@phosphor-icons/react';

export function LoadMore({ onClick, loading, hasMore, loaded, total }) {
  if (!hasMore && loaded > 0) {
    return (
      <p className="py-6 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
        End of feed {total != null && `· ${total} items`}
      </p>
    );
  }
  return (
    <div className="flex justify-center py-6">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 border border-line bg-surface px-6 py-2.5 font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-300 transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : null}
        {loading ? 'Loading…' : 'Load more'}
      </button>
    </div>
  );
}
