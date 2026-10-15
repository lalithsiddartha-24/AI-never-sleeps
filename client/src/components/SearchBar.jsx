import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownLeft, Loader2, Search, X } from 'lucide-react';
import api from '../api';
import { useDebounce, useOnClickOutside } from '../hooks/useCommon';
import { categoryStyle, timeAgo } from '../utils';
import { Monogram } from './Monogram';

const SECTION_META = {
  news: { label: 'News', path: (item) => `/news/${item.slug}` },
  tools: { label: 'Tools', path: (item) => `/tools/${item.slug}` },
  models: { label: 'Models', path: (item) => `/models?q=${encodeURIComponent(item.name)}` },
  companies: { label: 'Companies', path: (item) => `/companies/${item.slug}` },
  research: { label: 'Research', path: (item) => item.url || `/research?q=${encodeURIComponent(item.title)}` },
};

export function SearchBar({ variant = 'header' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(query, 300);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  useOnClickOutside(wrapRef, () => setOpen(false));

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const q = debounced.trim();
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    api
      .search(q, 4)
      .then((data) => {
        if (!cancelled) setResults(data || { news: [], tools: [], models: [], companies: [], research: [] });
      })
      .catch(() => {
        if (!cancelled) setResults({ news: [], tools: [], models: [], companies: [], research: [], error: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const sections = results
    ? Object.entries(SECTION_META)
        .map(([key, meta]) => ({ key, meta, items: results[key] || [] }))
        .filter((s) => s.items.length > 0)
    : [];
  const totalFound = sections.reduce((sum, s) => sum + s.items.length, 0);

  const isHeader = variant === 'header';
  return (
    <div ref={wrapRef} className={`relative ${isHeader ? 'w-full max-w-md' : 'w-full'}`}>
      <form onSubmit={submit} role="search">
        <div
          className={`flex items-center gap-2 border bg-surface transition-colors focus-within:border-accent/50 ${
            isHeader ? 'h-9 px-3' : 'h-12 px-4'
          } ${open && results ? (isHeader ? 'rounded-b-none' : '') : ''} border-line`}
        >
          {loading ? (
            <Loader2 size={isHeader ? 13 : 16} className="shrink-0 animate-spin text-accent" />
          ) : (
            <Search size={isHeader ? 13 : 16} className="shrink-0 text-zinc-500" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={isHeader ? 'Search news, tools, models…' : 'Search the AI ecosystem…'}
            className={`w-full bg-transparent outline-none placeholder:text-zinc-600 ${
              isHeader ? 'text-xs text-zinc-200' : 'text-sm text-zinc-100'
            }`}
            aria-label="Search"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
              aria-label="Clear search"
              className="text-zinc-600 hover:text-zinc-300"
            >
              <X size={isHeader ? 13 : 16} />
            </button>
          )}
          {isHeader && (
            <kbd className="hidden shrink-0 border border-line bg-surface2 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 sm:block">
              ⌘K
            </kbd>
          )}
          {!isHeader && (
            <button
              type="submit"
              className="hidden shrink-0 items-center gap-1 border border-line bg-surface2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300 transition-colors hover:border-accent/40 hover:text-accent sm:inline-flex"
            >
              Search <CornerDownLeft size={11} />
            </button>
          )}
        </div>
      </form>
      <AnimatePresence>
        {open && debounced.trim().length >= 2 && results && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 max-h-[70vh] overflow-y-auto border border-t-0 border-line bg-surface shadow-2xl shadow-black/60"
          >
            {results.error && (
              <p className="px-4 py-3 text-xs text-red-400">Search unavailable — backend not reachable.</p>
            )}
            {!results.error && totalFound === 0 && (
              <p className="px-4 py-4 text-center text-xs text-zinc-500">
                No results for “{debounced.trim()}”
              </p>
            )}
            {sections.map(({ key, meta, items }) => (
              <div key={key} className="border-b border-line last:border-b-0">
                <p className="px-3 pt-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600">
                  {meta.label}
                </p>
                {items.map((item) => {
                  const external = key === 'research' && item.url;
                  const body = (
                    <>
                      {key === 'news' || key === 'companies' ? (
                        <Monogram
                          name={key === 'news' ? item.source_name : item.name}
                          logoUrl={key === 'news' ? item.source_logo_url : item.logo_url}
                        />
                      ) : (
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            key === 'news' ? categoryStyle(item.category).dot : 'bg-accent'
                          }`}
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium text-zinc-200">
                          {item.title || item.name}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-zinc-500">
                          {key === 'news' && `${item.source_name || ''} · ${timeAgo(item.published_at)}`}
                          {key === 'tools' && `${item.company_name || ''} ${item.pricing_type ? `· ${item.pricing_type}` : ''}`}
                          {key === 'models' && `${item.developer || ''} ${item.model_type ? `· ${item.model_type}` : ''}`}
                          {key === 'companies' && item.description}
                          {key === 'research' && `${item.primary_category || ''} ${item.published_at ? `· ${timeAgo(item.published_at)}` : ''}`}
                        </span>
                      </span>
                    </>
                  );
                  if (external) {
                    return (
                      <a
                        key={`${key}-${item.id}`}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-surface2"
                      >
                        {body}
                      </a>
                    );
                  }
                  return (
                    <Link
                      key={`${key}-${item.id ?? item.slug}`}
                      to={meta.path(item)}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-surface2"
                    >
                      {body}
                    </Link>
                  );
                })}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(debounced.trim())}`);
              }}
              className="flex w-full items-center justify-center gap-1.5 border-t border-line bg-surface2/60 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-400 transition-colors hover:text-accent"
            >
              See all results <CornerDownLeft size={10} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
