import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Flame } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { CategoryChip } from './Chips';
import { Monogram } from './Monogram';
import { timeAgo } from '../utils';

const positions = [
  { y: 0, scale: 1, rotate: 0, opacity: 1 },
  { y: 23, scale: 0.94, rotate: 2.5, opacity: 0.72 },
  { y: 43, scale: 0.88, rotate: -2.5, opacity: 0.4 },
];

export function BreakingNewsStack({ articles = [] }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const stories = articles.filter(Boolean).slice(0, 3);
  const storyKey = stories.map((story) => story.id).join(':');

  useEffect(() => {
    setActive(0);
  }, [storyKey]);

  useEffect(() => {
    if (reduceMotion || stories.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % stories.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [reduceMotion, stories.length]);

  if (!stories.length) {
    return (
      <div aria-hidden="true" className="mx-auto h-64 w-full max-w-[420px] rounded-3xl border border-line bg-surface/60" />
    );
  }

  const ordered = stories.map((_, offset) => stories[(active + offset) % stories.length]);

  return (
    <div className="mx-auto w-full max-w-[420px]">
      <div className="mb-5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10"><Flame size={15} weight="fill" /></span>
          Breaking AI
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Top stories</span>
      </div>

      <div className="relative h-[290px] sm:h-[310px]" aria-label="Top three breaking AI stories">
        {ordered.map((article, position) => {
          const style = positions[position];
          const isFront = position === 0;
          return (
            <motion.article
              key={article.id}
              initial={false}
              animate={{
                y: style.y,
                scale: style.scale,
                rotate: style.rotate,
                opacity: style.opacity,
              }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 210, damping: 24 }}
              style={{ zIndex: stories.length - position }}
              className={`absolute inset-x-0 top-0 min-h-[250px] overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-xl shadow-black/20 sm:p-6 ${isFront ? '' : 'pointer-events-none'}`}
              aria-hidden={!isFront}
            >
              <div className="flex items-center justify-between gap-3">
                <CategoryChip category={article.category} />
                <span className="font-mono text-[10px] text-zinc-500">{timeAgo(article.published_at)}</span>
              </div>
              <Link
                to={`/news/${article.slug}`}
                tabIndex={isFront ? 0 : -1}
                className="mt-5 block text-xl font-bold leading-snug tracking-tight text-zinc-100 transition-colors hover:text-accent sm:text-2xl"
              >
                {article.title}
              </Link>
              {article.summary && (
                <p className="mt-3 clamp-3 text-sm leading-relaxed text-zinc-400">{article.summary}</p>
              )}
              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                <Monogram name={article.source_name} logoUrl={article.source_logo_url} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-300">{article.source_name || 'AI News'}</span>
                {isFront && <ArrowUpRight size={17} className="text-accent" />}
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5" aria-label={`Story ${active + 1} of ${stories.length}`}>
          {stories.map((story, index) => (
            <button
              key={story.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show story ${index + 1}`}
              aria-current={index === active ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${index === active ? 'w-7 bg-accent' : 'w-1.5 bg-zinc-600 hover:bg-zinc-400'}`}
            />
          ))}
        </div>
        <Link to="/news?sort=importance" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-accent">
          View all <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
