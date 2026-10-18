import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bell,
  BookmarkSimple as Bookmark,
  Clock,
  GraduationCap,
  MagnifyingGlass as Search,
  Sparkle as Sparkles,
  Tag,
} from '@phosphor-icons/react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { OfferCard } from '../components/OfferCard';
import { SkeletonGrid } from '../components/Skeletons';
import { ErrorState, EmptyState } from '../components/StateBlocks';
import { LoadMore } from '../components/LoadMore';
import { StatusPill } from '../components/StatusPill';
import { useDebounce, useLocalStorage } from '../hooks/useCommon';
import { useBookmarks } from '../hooks/useBookmarks';
import { OFFER_CATEGORIES, OFFER_TYPES } from '../utils';

const INTEREST_KEY = 'aihub:interests';
const ALERTS_KEY = 'aihub:offerAlerts';

// Maps the news-interest categories (Home personalization) onto offer categories.
const INTEREST_TO_OFFER = {
  'AI Coding': ['Coding'],
  'Open Source': ['Coding'],
  'AI Research': ['Research'],
  'AI Models': ['AI Models'],
  'Computer Vision': ['Image'],
  'Generative AI': ['Design', 'Image', 'Video'],
  Robotics: ['Cloud & Infrastructure'],
  'AI Hardware': ['Cloud & Infrastructure'],
  'AI Startups': ['Productivity'],
  'AI Business': ['Productivity'],
  'AI Agents': ['Coding', 'Productivity'],
};

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'recent', label: 'Recently added' },
  { key: 'verified', label: 'Recently verified' },
  { key: 'expiring', label: 'Expiring soon' },
];

const STATUS_OPTIONS = [
  { key: 'active', label: '🟢 Active' },
  { key: 'ongoing', label: '🔵 Ongoing' },
  { key: 'expiring', label: '🟡 Expiring' },
  { key: 'verification', label: '⚪ Verification' },
];

// §36 quick filters — a curated shortcut row mixing offer types and categories.
const QUICK_FILTERS = [
  { label: 'All', kind: 'all' },
  { label: 'Free', kind: 'type', value: 'Free for Students' },
  { label: 'Student Discount', kind: 'type', value: 'Student Discount' },
  { label: 'Free Credits', kind: 'type', value: 'Free Credits' },
  { label: 'Education Plan', kind: 'type', value: 'Education Plan' },
  { label: 'Developer Credits', kind: 'type', value: 'Developer Credits' },
  { label: 'Research', kind: 'category', value: 'Research' },
  { label: 'Coding', kind: 'category', value: 'Coding' },
  { label: 'Design', kind: 'category', value: 'Design' },
  { label: 'AI Agents', kind: 'q', value: 'agent' },
  { label: 'Image', kind: 'category', value: 'Image' },
  { label: 'Video', kind: 'category', value: 'Video' },
];

function readInterests() {
  try {
    const raw = window.localStorage.getItem(INTEREST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function DashCard({ icon: Icon, label, children, empty }) {
  return (
    <div className="flex flex-col border border-line bg-surface p-3.5">
      <p className="mb-2.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        <Icon size={11} className="text-accent" /> {label}
      </p>
      {empty ? (
        <p className="text-[11px] leading-relaxed text-zinc-600">{empty}</p>
      ) : (
        children
      )}
    </div>
  );
}

function MiniOfferList({ offers }) {
  if (!offers?.length) return null;
  return (
    <ul className="space-y-2">
      {offers.map((o) => (
        <li key={o.id}>
          <Link
            to={`/student-offers/${o.slug}`}
            className="group flex items-start justify-between gap-2 text-[11px] leading-snug text-zinc-300 hover:text-accent"
          >
            <span className="clamp-2">{o.title}</span>
            <span className="shrink-0 font-mono text-[9px] uppercase text-zinc-600">{o.category}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function StudentOffers() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const type = params.get('type') || '';
  const status = params.get('status') || '';
  const studentOnly = params.get('studentOnly') === '1';
  const sort = SORTS.some((s) => s.key === params.get('sort')) ? params.get('sort') : 'featured';
  const qParam = params.get('q') || '';

  const [query, setQuery] = useState(qParam);
  const debouncedQ = useDebounce(query, 300);

  const [state, setState] = useState({ items: [], total: 0, categories: [], types: [], loading: true, error: null });
  const [page, setPage] = useState(1);

  // Dashboard data (personalized overview) — independent of the filtered grid below.
  const { count: bookmarkCount } = useBookmarks();
  const [dash, setDash] = useState({ all: [], saved: [], loading: true });
  const [interests] = useState(readInterests);
  const [alertsOn, setAlertsOn] = useLocalStorage(ALERTS_KEY, false);

  const updateParam = (key, value, def) => {
    const next = new URLSearchParams(params);
    if (!value || value === def) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const applyQuick = (f) => {
    const next = new URLSearchParams(params);
    ['type', 'category', 'q'].forEach((k) => next.delete(k));
    if (f.kind === 'type') next.set('type', f.value);
    else if (f.kind === 'category') next.set('category', f.value);
    else if (f.kind === 'q') {
      next.set('q', f.value);
      setQuery(f.value);
    }
    setParams(next, { replace: true });
  };

  const quickActive = (f) => {
    if (f.kind === 'all') return !category && !type && !qParam;
    if (f.kind === 'type') return type === f.value && !category;
    if (f.kind === 'category') return category === f.value && !type;
    if (f.kind === 'q') return qParam === f.value;
    return false;
  };

  useEffect(() => {
    if (debouncedQ !== qParam) updateParam('q', debouncedQ, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  // Filtered browse grid.
  useEffect(() => {
    const ac = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    setPage(1);
    api
      .getStudentOffers(
        { page: 1, pageSize: 24, category, type, status, studentOnly: studentOnly ? 1 : '', q: debouncedQ, sort },
        ac.signal
      )
      .then((data) =>
        setState({
          items: data.items || [],
          total: data.total || 0,
          categories: data.categories || [],
          types: data.types || [],
          loading: false,
          error: null,
        })
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, type, status, studentOnly, sort, debouncedQ]);

  // Dashboard: full offer set + saved offers.
  useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      api.getStudentOffers({ page: 1, pageSize: 100, sort: 'featured' }, ac.signal),
      api.getBookmarks('default', ac.signal).catch(() => ({ offers: [] })),
    ])
      .then(([all, bm]) =>
        setDash({ all: all.items || [], saved: bm.offers || [], loading: false })
      )
      .catch((err) => {
        if (err.name !== 'AbortError') setDash((d) => ({ ...d, loading: false, error: err.message }));
      });
    return () => ac.abort();
  }, [bookmarkCount]);

  const countFor = (cat) => state.categories.find((c) => c.category === cat)?.count || 0;

  const loadMore = () => {
    const next = page + 1;
    setState((s) => ({ ...s, loading: true }));
    api
      .getStudentOffers({ page: next, pageSize: 24, category, type, status, studentOnly: studentOnly ? 1 : '', q: debouncedQ, sort })
      .then((data) =>
        setState((s) => ({ ...s, items: [...s.items, ...(data.items || [])], total: data.total || s.total, loading: false }))
      )
      .catch((err) => setState((s) => ({ ...s, loading: false, error: err.message })));
    setPage(next);
  };

  const active = useMemo(() => dash.all.filter((o) => o.status !== 'expired'), [dash.all]);

  const recommended = useMemo(() => {
    const cats = new Set();
    interests.forEach((i) => (INTEREST_TO_OFFER[i] || []).forEach((c) => cats.add(c)));
    let list = cats.size ? active.filter((o) => cats.has(o.category)) : active.filter((o) => o.featured === 1);
    return list.slice(0, 4);
  }, [active, interests]);

  const recent = useMemo(
    () => [...dash.all].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 4),
    [dash.all]
  );

  const expiring = useMemo(() => {
    const now = Date.now();
    const limit = now + 45 * 864e5;
    return dash.all
      .filter((o) => {
        if (o.status === 'expired' || !o.expiration_date) return false;
        const t = new Date(o.expiration_date).getTime();
        return !Number.isNaN(t) && t >= now && t <= limit;
      })
      .slice(0, 4);
  }, [dash.all]);

  const myCategories = useMemo(() => {
    const set = new Set(dash.saved.map((o) => o.category));
    interests.forEach((i) => (INTEREST_TO_OFFER[i] || []).forEach((c) => set.add(c)));
    return [...set];
  }, [dash.saved, interests]);

  return (
    <div className="space-y-8">
      {/* §36 Hero */}
      <section className="border border-line bg-gradient-to-b from-surface to-ink px-5 py-8 sm:px-8">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
          <GraduationCap size={13} /> For students
        </p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase tracking-tight text-zinc-50 sm:text-4xl">
          AI for Students
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
          Discover free AI tools, student discounts, credits and education plans — every offer traced to
          its official source and marked with its real verification status.
        </p>
        <div className="relative mt-5 max-w-xl">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student offers..."
            aria-label="Search student offers"
            className="h-12 w-full border border-line bg-surface pl-11 pr-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-accent/50"
          />
        </div>
        {/* Quick filters */}
        <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 sm:flex-wrap">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => applyQuick(f)}
              className={`shrink-0 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                quickActive(f)
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-line bg-surface text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* §46 Alerts (opt-in) + §45 dashboard */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-surface px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={14} className={alertsOn ? 'text-accent' : 'text-zinc-600'} />
            <div>
              <p className="text-xs font-medium text-zinc-200">Offer alerts</p>
              <p className="font-mono text-[10px] text-zinc-600">
                In-app only. Off unless you enable them — we never send alerts you didn't ask for.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlertsOn((v) => !v)}
            aria-pressed={alertsOn}
            className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              alertsOn
                ? 'border-accent/50 bg-accent/10 text-accent'
                : 'border-line bg-surface2 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {alertsOn ? 'Alerts on' : 'Enable alerts'}
          </button>
        </div>

        {alertsOn && (
          <div className="border border-accent/30 bg-accent/[0.04] p-4">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Your alerts</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">Expiring soon</p>
                {expiring.length ? (
                  <MiniOfferList offers={expiring} />
                ) : (
                  <p className="text-[11px] text-zinc-600">No tracked offers are close to expiring.</p>
                )}
              </div>
              <div>
                <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wider text-zinc-500">Newly added</p>
                <MiniOfferList offers={recent} />
              </div>
            </div>
          </div>
        )}

        {/* §45 Student dashboard */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashCard
            icon={Bookmark}
            label="My Offers"
            empty="Save offers with the bookmark button to build your list."
          >
            {dash.saved.length ? (
              <MiniOfferList offers={dash.saved.slice(0, 4)} />
            ) : (
              <p className="text-[11px] text-zinc-600">Nothing saved yet.</p>
            )}
          </DashCard>
          <DashCard icon={Sparkles} label="Recommended for You" empty="Pick interests on the homepage to personalize.">
            {recommended.length ? (
              <MiniOfferList offers={recommended} />
            ) : (
              <p className="text-[11px] text-zinc-600">No matches for your interests yet.</p>
            )}
          </DashCard>
          <DashCard icon={Clock} label="Expiring Soon" empty="No tracked offers are close to expiring.">
            <MiniOfferList offers={expiring} />
          </DashCard>
          <DashCard icon={Tag} label="My Categories" empty="Your categories appear here once you save offers or pick interests.">
            {myCategories.length ? (
              <div className="flex flex-wrap gap-1.5">
                {myCategories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateParam('category', c, '')}
                    className="border border-line bg-surface2 px-2 py-0.5 font-mono text-[10px] text-zinc-300 hover:border-accent/50 hover:text-accent"
                  >
                    {c}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-600">No categories yet.</p>
            )}
          </DashCard>
        </div>
      </section>

      {/* Browse controls */}
      <div className="space-y-3">
        <SectionHeader
          label="Browse"
          title="All Student Offers"
          icon={GraduationCap}
          action={
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600 tnum">
              {state.total > 0 ? `${state.total} offers` : ''}
            </span>
          }
        />

        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <Pill label="All categories" active={!category} onClick={() => updateParam('category', '', '')} />
          {OFFER_CATEGORIES.map((cat) => (
            <Pill
              key={cat}
              label={cat}
              count={countFor(cat)}
              active={category === cat}
              onClick={() => updateParam('category', category === cat ? '' : cat, '')}
            />
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(e) => updateParam('type', e.target.value, '')}
            aria-label="Filter by offer type"
            className="h-8 border border-line bg-surface px-2 font-mono text-[10px] uppercase tracking-wider text-zinc-300 outline-none focus:border-accent/50"
          >
            <option value="">All types</option>
            {OFFER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {STATUS_OPTIONS.map((s) => {
            const on = status.split(',').filter(Boolean).includes(s.key);
            const toggleStatus = () => {
              const cur = status.split(',').filter(Boolean);
              const next = on ? cur.filter((x) => x !== s.key) : [...cur, s.key];
              updateParam('status', next.join(','), '');
            };
            return (
              <button
                key={s.key}
                type="button"
                onClick={toggleStatus}
                className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  on ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line bg-surface text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {s.label}
              </button>
            );
          })}

          <label className="inline-flex cursor-pointer items-center gap-1.5 border border-line bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            <input
              type="checkbox"
              checked={studentOnly}
              onChange={(e) => updateParam('studentOnly', e.target.checked ? '1' : '', '')}
              className="h-3 w-3 accent-[var(--color-accent)]"
            />
            Student-only
          </label>

          <div className="ml-auto flex flex-wrap items-center gap-1">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => updateParam('sort', s.key, 'featured')}
                className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  sort === s.key ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line bg-surface text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {state.error ? (
        <ErrorState message={state.error} />
      ) : state.loading && state.items.length === 0 ? (
        <SkeletonGrid count={8} />
      ) : state.items.length === 0 ? (
        <EmptyState
          title="No offers match your filters"
          message="Try clearing the search or choosing a different category or type."
          icon={GraduationCap}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {state.items.map((o, i) => (
              <OfferCard key={o.id} offer={o} index={i % 12} />
            ))}
          </div>
          <LoadMore
            onClick={loadMore}
            loading={state.loading}
            hasMore={state.items.length < state.total}
            loaded={state.items.length}
            total={state.total}
          />
        </>
      )}

      <p className="border-t border-line pt-4 font-mono text-[10px] leading-relaxed text-zinc-600">
        Transparency: offers are sourced from official company pages. Statuses reflect the latest automated
        check — an offer is only shown as active when its official page was reachable. Where a benefit could
        not be confirmed it is marked <StatusPill status="verification" className="mx-1 align-middle" /> and
        never presented as guaranteed.
      </p>
    </div>
  );
}

function Pill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? 'border-accent/50 bg-accent/10 text-accent'
          : 'border-line bg-surface text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
      }`}
    >
      {label}
      {count != null && count > 0 && (
        <span className={`tnum text-[9px] ${active ? 'text-accent/70' : 'text-zinc-600'}`}>{count}</span>
      )}
    </button>
  );
}
