import { Suspense, lazy } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Pulse as Activity, BookmarkSimple as Bookmark, MagnifyingGlass as Search, GearSix as Settings } from '@phosphor-icons/react';
import { SearchBar } from './components/SearchBar';
import { SkeletonGrid } from './components/Skeletons';
import { useBookmarks } from './hooks/useBookmarks';
import { useScrollTop } from './hooks/useCommon';

import Home from './pages/Home';
import News from './pages/News';
import ArticlePage from './pages/ArticlePage';
import Tools from './pages/Tools';
import ToolPage from './pages/ToolPage';
import Models from './pages/Models';
import Research from './pages/Research';
import Companies from './pages/Companies';
import CompanyPage from './pages/CompanyPage';
import Agents from './pages/Agents';
import StudentOffers from './pages/StudentOffers';
import SearchPage from './pages/Search';
import Bookmarks from './pages/Bookmarks';

const Admin = lazy(() => import('./pages/Admin'));
const StudentOfferPage = lazy(() => import('./pages/StudentOfferPage'));

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/news', label: 'News' },
  { to: '/tools', label: 'Tools' },
  { to: '/models', label: 'Models' },
  { to: '/research', label: 'Research' },
  { to: '/companies', label: 'Companies' },
  { to: '/student-offers', label: 'Student Offers' },
  { to: '/agents', label: 'Agents' },
];

function Header() {
  const { count } = useBookmarks();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 shadow-[0_1px_0_rgba(11,84,151,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
            <Activity size={16} />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block text-[14px] font-bold tracking-tight text-zinc-50">
              AI Never <span className="text-accent">Sleeps</span>
            </span>
            <span className="mt-1 block text-[10px] tracking-wide text-zinc-500">
              Your always-on AI radar
            </span>
          </span>
        </Link>
        <nav className="no-scrollbar -mx-1 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3 py-2 text-[12px] font-medium transition-colors ${
                  isActive
                    ? 'bg-surface2 text-zinc-50'
                    : 'text-zinc-400 hover:bg-surface2 hover:text-zinc-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto hidden w-full max-w-xs lg:block">
          <SearchBar variant="header" />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
          <Link
            to="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-zinc-400 transition-colors hover:bg-surface2 hover:text-zinc-50 lg:hidden"
          >
            <Search size={14} />
          </Link>
          <Link
            to="/bookmarks"
            aria-label="Bookmarks"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-accent transition-colors hover:border-accent/40 hover:bg-accent/5"
          >
            <Bookmark size={17} weight="regular" color="#0B5497" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold text-ink tnum">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <Link
            to="/admin"
            aria-label="Admin"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-zinc-500 transition-colors hover:bg-surface2 hover:text-zinc-50"
          >
            <Settings size={14} />
          </Link>
        </div>
      </div>
      <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'bg-surface2 text-zinc-50'
                  : 'text-zinc-400 hover:bg-surface2 hover:text-zinc-50'
            }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/70">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-3 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <p className="text-xs tracking-wide text-zinc-500">
          AI Never Sleeps — Everything happening in AI. One place.
        </p>
        <div className="flex gap-4 text-xs text-zinc-500">
          <Link to="/news" className="transition-colors hover:text-accent">News</Link>
          <Link to="/tools" className="transition-colors hover:text-accent">Tools</Link>
          <Link to="/student-offers" className="transition-colors hover:text-accent">Student Offers</Link>
          <Link to="/admin" className="transition-colors hover:text-accent">Admin</Link>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  useScrollTop(location.pathname);
  return (
    <div className="flex min-h-screen flex-col bg-ink">
      <Header />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<SkeletonGrid count={6} />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:slug" element={<ArticlePage />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/tools/:slug" element={<ToolPage />} />
                <Route path="/models" element={<Models />} />
                <Route path="/research" element={<Research />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/companies/:slug" element={<CompanyPage />} />
                <Route path="/student-offers" element={<StudentOffers />} />
                <Route path="/student-offers/:slug" element={<StudentOfferPage />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/admin" element={<Admin />} />
                <Route
                  path="*"
                  element={
                    <div className="py-24 text-center">
                      <p className="font-mono text-4xl font-bold text-zinc-700">404</p>
                      <p className="mt-2 text-sm text-zinc-400">Page not found.</p>
                      <Link to="/" className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-accent hover:underline">
                        Back to hub
                      </Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
