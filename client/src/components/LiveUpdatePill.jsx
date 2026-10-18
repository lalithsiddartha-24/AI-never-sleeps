import { AnimatePresence, motion } from 'framer-motion';
import { ArrowCircleUp as ArrowUpCircle, Radio } from '@phosphor-icons/react';
import { timeAgo } from '../utils';

export function LiveUpdatePill({ newCount, onClick, updatedAt, lastUpdate }) {
  return (
    <>
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {newCount > 0 && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={onClick}
              className="pointer-events-auto inline-flex items-center gap-2 border border-accent/30 bg-surface px-4 py-2 text-xs font-medium text-accent shadow-lg shadow-zinc-900/10 transition-colors hover:bg-surface2"
            >
              <ArrowUpCircle size={14} />
              <span className="tnum font-mono">{newCount}</span> new AI {newCount === 1 ? 'story' : 'stories'} — tap to refresh
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {updatedAt && newCount === 0 && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface/90 px-3 py-1.5 font-mono text-[10px] text-zinc-500">
            <Radio size={10} className="text-accent" /> Updated {timeAgo(updatedAt)}
            {lastUpdate ? ` · feed synced ${timeAgo(lastUpdate)}` : ''}
          </span>
        </div>
      )}
    </>
  );
}
