import { Warning as AlertTriangle, Tray as Inbox, ArrowClockwise as RefreshCw } from '@phosphor-icons/react';

export function ErrorState({ message, onRetry, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 border border-line bg-surface text-center ${
        compact ? 'px-4 py-6' : 'px-6 py-14'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700">
        <AlertTriangle size={18} />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-200">Something went wrong</p>
        <p className="mt-1 max-w-md text-xs text-zinc-500">{message || 'Unable to load data.'}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 border border-line bg-surface2 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100"
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, icon: Icon = Inbox, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 border border-line bg-surface text-center ${
        compact ? 'px-4 py-6' : 'px-6 py-14'
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface2 text-zinc-500">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-300">{title}</p>
        {message && <p className="mt-1 max-w-md text-xs text-zinc-500">{message}</p>}
      </div>
    </div>
  );
}
