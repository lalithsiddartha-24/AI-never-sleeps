import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Pulse as Activity,
  ArrowRight,
  Robot as Bot,
  Cpu,
  FileText,
  Flame,
  GraduationCap,
  Newspaper,
  Sparkle as Sparkles,
  Wrench,
  X,
} from '@phosphor-icons/react';
import api from '../api';
import { SearchBar } from '../components/SearchBar';
import { SectionHeader } from '../components/SectionHeader';
import { NewsCard, NewsListItem } from '../components/NewsCard';
import { ToolCard } from '../components/ToolCard';
import { OfferCard } from '../components/OfferCard';
import { ModelCard } from '../components/ModelCard';
import { PaperCard } from '../components/PaperCard';
import { LiveUpdatePill } from '../components/LiveUpdatePill';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { LoadMore } from '../components/LoadMore';
import { FilterBar } from '../components/FilterBar';
import { useLocalStorage } from '../hooks/useCommon';
import { useLiveUpdates as useLive } from '../hooks/useLiveUpdates';
import { NEWS_CATEGORIES } from '../utils';

const INTEREST_KEY = 'aihub:interests';
const INTEREST_SEEN_KEY = 'aihub:interests:seen';

function InterestPicker({ selected, onSave, onDismiss }) {
  const [local, setLocal] = useState(selected || []);
  const toggle = (cat) =>
    setLocal((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  return (
    <div className="border border-accent/30 bg-surface p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Personalize</p>
          <h2 className="mt-1 text-sm font-bold uppercase tracking-wide text-zinc-100">
            Pick your interests
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Your hub prioritizes the categories you care about. Change anytime from the For You section.
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-zinc-600 transition-colors hover:text-zinc-300"
          >
            <X size={16} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {NEWS_CATEGORIES.filter((c) => c !== 'Uncategorized').map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            aria-pressed={local.includes(cat)}
            className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
              local.includes(cat)
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-line bg-surface2 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            {local.includes(cat) ? '☑ ' : '☐ '}
            {cat}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={local.length === 0}
        onClick={() => onSave(local)}
        className="mt-4 inline-flex items-center gap-2 bg-accent px-5 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Save interests <ArrowRight size={13} />
      </button>
    </div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [interests, setInterests] = useLocalStorage(INTEREST_KEY, []);
  const [pickerSeen, setPickerSeen] = useLocalStorage(INTEREST_SEEN_KEY, false);
  const [editingInterests, setEditingInterests] = useState(false);

  const [breaking, setBreaking] = useState({ loading: true, data: null, error: null });
  const [trending, setTrending] = useState({ loading: true, data: null, error: null });
  const [tools, setTools] = useState({ loading: true, data: null, error: null });
  const [models, setModels] = useState({ loading: true, data: null, error: null });
  const [papers, setPapers] = useState({ loading: true, data: null, error: null });
  const [agentNews, setAgentNews] = useState({ loading: true, data: null, error: null });
  const [offers, setOffers] = useState({ loading: true, data: null, error: null });

  const [category, setCategory] = useState('');
  const [feed, setFeed] = useState({ items: [], total: 0, page: 1, loading: true, error: null });
  const [feedPage, setFeedPage] = useState(1);

  const { newCount, lastUpdate, updatedAt, consumeUpdates, refreshKey } = useLive();

  useEffect(() => {
    const ac = new AbortController();
    const load = async (setter, promise) => {
      try {
        setter({ loading: false, data: await promise, error: null });
      } catch (err) {
        if (err.name !== 'AbortError') setter({ loading: false, data: null, error: err.message });
      }
    };
    setBreaking((s) => ({ ...s, loading: true }));
    setTrending((s) => ({ ...s, loading: true }));
    setTools((s) => ({ ...s, loading: true }));
    setModels((s) => ({ ...s, loading: true }));
    setPapers((s) => ({ ...s, loading: true }));
    setAgentNews((s) => ({ ...s, loading: true }));
    setOffers((s) => ({ ...s, loading: true }));
    load(setBreaking, api.getBreaking(5, ac.signal));
    load(setTrending, api.getTrending(8, ac.signal));
    load(setTools, api.getTools({ pageSize: 8, sort: 'featured' }, ac.signal));
    load(setModels, api.getModels({ pageSize: 4 }, ac.signal));
    load(setPapers, api.getResearch({ pageSize: 3 }, ac.signal));
    load(setAgentNews, api.getNews({ category: 'AI Agents', pageSize: 3, clustered: 1 }, ac.signal));
    load(setOffers, api.getFeaturedOffers(6, ac.signal));
    return () => ac.abort();
  }, [refreshKey]);

  useEffect(() => {
    const ac = new AbortController();
    setFeed((f) => ({ ...f, loading: true, error: null }));
    api
      .getNews({ page: 1, pageSize: 9, category, clustered: 1 }, ac.signal)
      .then((data) =>
        setFeed({ items: data.items || [], total: data.total || 0, page: 1, loading: false, error: null })
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setFeed((f) => ({ ...f, loading: false, error: err.message }));
      });
    return () => ac.abort();
  }, [category, refreshKey]);

  const loadMoreFeed = () => {
    const next = feedPage + 1;
    setFeed((f) => ({ ...f, loading: true }));
    api
      .getNews({ page: next, pageSize: 9, category, clustered: 1 })
      .then((data) =>
        setFeed((f) => ({
          items: [...f.items, ...(data.items || [])],
          total: data.total || f.total,
          page: next,
          loading: false,
          error: null,
        }))
      )
      .catch((err) => setFeed((f) => ({ ...f, loading: false, error: err.message })));
    setFeedPage(next);
  };

  useEffect(() => setFeedPage(1), [category, refreshKey]);

  const forYou = useMemo(() => {
    if (!interests.length || !feed.items.length) return null;
    const mine = feed.items.filter((a) => interests.includes(a.category));
    return mine.length ? mine : null;
  }, [interests, feed.items]);

  const showPicker = !pickerSeen || editingInterests;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        className="relative isolate overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-surface via-surface to-accent/10 shadow-sm"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-accent/[0.07] blur-3xl" />
          <div className="absolute -bottom-36 left-[18%] h-72 w-72 rounded-full bg-sky-400/[0.08] blur-3xl" />
          <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(var(--color-accent)_0.7px,transparent_0.7px)] [background-size:24px_24px]" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-14 lg:py-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: 'easeOut' }}
          className="relative z-10"
        >
        <p className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-surface/90 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent shadow-sm">
            <span className="relative flex h-2 w-2">
              {!reduceMotion && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Always on. Always moving.
          </p>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.04] tracking-[-0.05em] text-zinc-50 sm:text-5xl lg:text-6xl">
            Your AI signal,
            <br />
            <span className="relative inline-block text-accent">
              never sleeps.
              <motion.span
                aria-hidden="true"
                initial={reduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.65, ease: 'easeOut' }}
                className="absolute -bottom-1 left-0 h-1 w-full origin-left rounded-full bg-accent/25"
              />
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            The latest news, tools, models, research and agents — thoughtfully gathered in one place.
          </p>
          <div className="mt-7 max-w-2xl">
            <SearchBar variant="hero" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            <Link to="/news" className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-zinc-500 transition-colors hover:border-accent/30 hover:text-accent">News</Link>
            <Link to="/tools" className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-zinc-500 transition-colors hover:border-accent/30 hover:text-accent">Tools</Link>
            <Link to="/models" className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-zinc-500 transition-colors hover:border-accent/30 hover:text-accent">Models</Link>
            <Link to="/research" className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-zinc-500 transition-colors hover:border-accent/30 hover:text-accent">Research</Link>
            <Link to="/companies" className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-zinc-500 transition-colors hover:border-accent/30 hover:text-accent">Companies</Link>
            <Link to="/student-offers" className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-zinc-500 transition-colors hover:border-accent/30 hover:text-accent">Student Offers</Link>
            <Link to="/agents" className="rounded-full border border-line bg-surface/80 px-3 py-1.5 text-zinc-500 transition-colors hover:border-accent/30 hover:text-accent">Agents</Link>
          </div>
        </motion.div>
          <div aria-hidden="true" className="relative mx-auto aspect-square w-full max-w-[420px]">
            <div className="absolute inset-[8%] rounded-full bg-accent/[0.05] blur-2xl" />
            <motion.div
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={reduceMotion ? undefined : { duration: 72, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[8%] rounded-full border border-dashed border-accent/20"
            >
              <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent shadow-[0_0_20px_rgba(11,84,151,0.5)]" />
            </motion.div>
            <motion.div
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={reduceMotion ? undefined : { duration: 48, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[19%] rounded-full border border-accent/15"
            >
              <span className="absolute right-[8%] top-[14%] h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_16px_rgba(14,165,233,0.55)]" />
            </motion.div>
            <div className="absolute inset-[28%] rounded-full border border-accent/10" />
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.045, 1] }}
              transition={reduceMotion ? undefined : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[2rem] border border-white/30 bg-accent text-white shadow-[0_24px_70px_rgba(11,84,151,0.28)] sm:h-36 sm:w-36"
            >
              <Sparkles size={34} weight="duotone" />
              <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">AI signal</span>
              <span className="mt-0.5 text-sm font-semibold tracking-tight">Live now</span>
            </motion.div>

            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-0 top-[22%] flex items-center gap-2 rounded-2xl border border-line bg-surface/95 px-3 py-2 shadow-lg shadow-accent/5 sm:left-[2%]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent"><Newspaper size={17} weight="duotone" /></span>
              <span><span className="block text-[9px] font-semibold uppercase tracking-widest text-zinc-500">Signal</span><span className="block text-xs font-semibold text-zinc-100">AI news</span></span>
            </motion.div>
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
              transition={reduceMotion ? undefined : { duration: 4.3, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className="absolute right-0 top-[38%] flex items-center gap-2 rounded-2xl border border-line bg-surface/95 px-3 py-2 shadow-lg shadow-accent/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700"><Cpu size={17} weight="duotone" /></span>
              <span><span className="block text-[9px] font-semibold uppercase tracking-widest text-zinc-500">Watchlist</span><span className="block text-xs font-semibold text-zinc-100">New models</span></span>
            </motion.div>
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={reduceMotion ? undefined : { duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              className="absolute bottom-[17%] left-[12%] flex items-center gap-2 rounded-2xl border border-line bg-surface/95 px-3 py-2 shadow-lg shadow-accent/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700"><FileText size={17} weight="duotone" /></span>
              <span><span className="block text-[9px] font-semibold uppercase tracking-widest text-zinc-500">Explore</span><span className="block text-xs font-semibold text-zinc-100">Fresh research</span></span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Interest picker */}
      {showPicker && (
        <section>
          <InterestPicker
            selected={interests}
            onSave={(cats) => {
              setInterests(cats);
              setPickerSeen(true);
              setEditingInterests(false);
            }}
            onDismiss={
              pickerSeen
                ? () => setEditingInterests(false)
                : () => setPickerSeen(true)
            }
          />
        </section>
      )}

      {/* Breaking */}
      <section>
        <SectionHeader
          label="What's important"
          title="Breaking AI"
          icon={Flame}
          action={
            <Link to="/news?sort=importance" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent">
              All news <ArrowRight size={12} />
            </Link>
          }
        />
        {breaking.loading ? (
          <SkeletonGrid count={3} />
        ) : breaking.error ? (
          <ErrorState message={breaking.error} />
        ) : (
          <div className="news-card-masonry">
            {(breaking.data?.items || []).slice(0, 3).map((a, i) => (
              <NewsCard key={a.id} article={a} index={i} />
            ))}
          </div>
        )}
        {!breaking.loading && !breaking.error && (breaking.data?.items || []).length > 3 && (
          <div className="news-card-masonry mt-4">
            {breaking.data.items.slice(3, 5).map((a, i) => (
              <NewsCard key={a.id} article={a} index={i} dense />
            ))}
          </div>
        )}
      </section>

      {/* Trending + For You */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <SectionHeader label="Most discussed" title="Trending Now" icon={Activity} />
          <div className="border border-line bg-surface">
            {trending.loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 animate-pulse rounded bg-line/70" />
                ))}
              </div>
            ) : (
              (trending.data?.items || []).map((a, i) => (
                <NewsListItem key={a.id} article={a} index={i} />
              ))
            )}
          </div>
        </div>
        <div>
          <SectionHeader
            label="Prioritized for you"
            title="For You"
            icon={Sparkles}
            action={
              <button
                type="button"
                onClick={() => setEditingInterests(true)}
                className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent"
              >
                Edit interests
              </button>
            }
          />
          {interests.length === 0 ? (
            <EmptyState
              title="No interests selected"
              message="Pick the topics you care about and your personal feed will appear here."
              icon={Sparkles}
            />
          ) : forYou ? (
            <div className="news-card-masonry">
              {forYou.slice(0, 4).map((a, i) => (
                <NewsCard key={a.id} article={a} index={i} dense />
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              title="Nothing new in your topics yet"
              message={`Watching: ${interests.join(', ')}`}
              icon={Sparkles}
            />
          )}
        </div>
      </section>

      {/* Latest news */}
      <section>
        <SectionHeader
          label="What's new"
          title="Latest AI News"
          icon={Newspaper}
          action={
            <Link to="/news" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent">
              Full feed <ArrowRight size={12} />
            </Link>
          }
        />
        <FilterBar
          options={NEWS_CATEGORIES.filter((c) => c !== 'Uncategorized')}
          value={category}
          onChange={setCategory}
          colored
          className="mb-5"
        />
        {feed.error ? (
          <ErrorState message={feed.error} />
        ) : feed.loading && feed.items.length === 0 ? (
          <SkeletonGrid count={6} />
        ) : feed.items.length === 0 ? (
          <EmptyState title="No stories in this category yet" message="Try another filter or check back after the next ingestion run." />
        ) : (
          <>
            <div className="news-card-masonry">
              {feed.items.map((a, i) => (
                <NewsCard key={a.id} article={a} index={i} />
              ))}
            </div>
            <LoadMore
              onClick={loadMoreFeed}
              loading={feed.loading}
              hasMore={feed.items.length < feed.total}
              loaded={feed.items.length}
              total={feed.total}
            />
          </>
        )}
      </section>

      {/* Tools */}
      <section>
        <SectionHeader
          label="What to use"
          title="Featured AI Tools"
          icon={Wrench}
          action={
            <Link to="/tools" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent">
              Browse directory <ArrowRight size={12} />
            </Link>
          }
        />
        {tools.loading ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(tools.data?.items || []).map((t, i) => (
              <ToolCard key={t.id} tool={t} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Student picks */}
      <section>
        <SectionHeader
          label="Student picks"
          title="Power your learning without paying full price."
          icon={GraduationCap}
          action={
            <Link to="/student-offers" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent">
              Explore All Student Offers <ArrowRight size={12} />
            </Link>
          }
        />
        {offers.loading ? (
          <SkeletonGrid count={4} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(offers.data?.items || []).slice(0, 6).map((o, i) => (
              <OfferCard key={o.id} offer={o} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Models + Research */}
      <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionHeader
            label="Recently released"
            title="New Models"
            icon={Cpu}
            action={
              <Link to="/models" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent">
                Model DB <ArrowRight size={12} />
              </Link>
            }
          />
          {models.loading ? (
            <SkeletonGrid count={2} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(models.data?.items || []).map((m, i) => (
                <ModelCard key={m.id} model={m} index={i} />
              ))}
            </div>
          )}
        </div>
        <div>
          <SectionHeader
            label="What to learn"
            title="Latest Research"
            icon={FileText}
            action={
              <Link to="/research" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent">
                All papers <ArrowRight size={12} />
              </Link>
            }
          />
          {papers.loading ? (
            <SkeletonGrid count={2} />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(papers.data?.items || []).map((p, i) => (
                <PaperCard key={p.id} paper={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Agents */}
      <section>
        <SectionHeader
          label="Agentic systems"
          title="AI Agents"
          icon={Bot}
          action={
            <Link to="/agents" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-accent">
              Agent hub <ArrowRight size={12} />
            </Link>
          }
        />
        {agentNews.loading ? (
          <SkeletonGrid count={3} />
        ) : (
          <div className="news-card-masonry">
            {(agentNews.data?.items || []).map((a, i) => (
              <NewsCard key={a.id} article={a} index={i} dense />
            ))}
          </div>
        )}
      </section>

      <LiveUpdatePill
        newCount={newCount}
        onClick={consumeUpdates}
        updatedAt={updatedAt}
        lastUpdate={lastUpdate}
      />
    </div>
  );
}
