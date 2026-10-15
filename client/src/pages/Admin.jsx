import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Gauge,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Rss,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
import api from '../api';
import { SectionHeader } from '../components/SectionHeader';
import { Badge } from '../components/Chips';
import { OffersManager } from '../components/OffersManager';
import { ErrorState } from '../components/StateBlocks';
import { timeAgo } from '../utils';

function StatCard({ label, value, tone = 'neutral', icon: Icon }) {
  const tones = {
    neutral: 'text-zinc-100',
    accent: 'text-accent',
    red: 'text-red-400',
    amber: 'text-amber-300',
    green: 'text-emerald-300',
  };
  return (
    <div className="border border-line bg-surface p-4">
      <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
        {Icon && <Icon size={11} />} {label}
      </p>
      <p className={`mt-2 font-mono text-2xl font-bold tnum ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function AddSourceForm({ onAdded }) {
  const [form, setForm] = useState({ name: '', feed_url: '', url: '', feed_type: 'rss', category: 'news', priority: 3 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.admin.addSource(form);
      setForm({ name: '', feed_url: '', url: '', feed_type: 'rss', category: 'news', priority: 3 });
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input =
    'h-9 border border-line bg-surface2 px-2.5 text-xs text-zinc-200 outline-none focus:border-accent/50 placeholder:text-zinc-600';

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
      <input required className={input} placeholder="Source name" value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input required className={`${input} lg:col-span-2`} placeholder="Feed URL (https://…)" value={form.feed_url}
        onChange={(e) => setForm({ ...form, feed_url: e.target.value })} />
      <select className={input} value={form.feed_type} onChange={(e) => setForm({ ...form, feed_type: e.target.value })}>
        <option value="rss">RSS</option>
        <option value="atom">Atom</option>
        <option value="arxiv">arXiv</option>
        <option value="github">GitHub</option>
      </select>
      <select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}>
        {[1, 2, 3, 4, 5].map((p) => (
          <option key={p} value={p}>Priority {p}</option>
        ))}
      </select>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-9 items-center justify-center gap-1.5 bg-accent px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
      </button>
      {error && <p className="text-xs text-red-400 sm:col-span-2 lg:col-span-6">{error}</p>}
    </form>
  );
}

const LOG_STATUS = {
  ok: { icon: CheckCircle2, cls: 'text-emerald-400' },
  empty: { icon: Activity, cls: 'text-zinc-500' },
  error: { icon: XCircle, cls: 'text-red-400' },
};

export default function Admin() {
  const [stats, setStats] = useState({ loading: true, data: null, error: null });
  const [sources, setSources] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [s, src] = await Promise.all([api.admin.stats(), api.admin.getSources()]);
      setStats({ loading: false, data: s, error: null });
      setSources(src.items || []);
    } catch (err) {
      setStats({ loading: false, data: null, error: err.message });
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const result = await api.admin.refresh();
      setRefreshResult(result);
      notify(result.started ? 'Ingestion running in background…' : `Refresh done: ${result.added ?? 0} added`);
      await load();
    } catch (err) {
      notify(`Refresh failed: ${err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSource = async (src) => {
    try {
      await api.admin.patchSource(src.id, { active: src.active ? 0 : 1 });
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  const deleteSource = async (src) => {
    if (!window.confirm(`Remove source "${src.name}"?`)) return;
    try {
      await api.admin.deleteSource(src.id);
      await load();
    } catch (err) {
      notify(err.message);
    }
  };

  if (stats.error) return <ErrorState message={stats.error} onRetry={load} />;

  const s = stats.data;

  return (
    <div className="space-y-10">
      <SectionHeader
        label="Operations"
        title="Admin Dashboard"
        icon={Gauge}
        action={
          <button
            type="button"
            onClick={triggerRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-accent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            {refreshing ? 'Refreshing…' : 'Trigger data refresh'}
          </button>
        }
      />

      {refreshResult && (
        <p className="border border-line bg-surface px-4 py-2.5 font-mono text-[11px] text-zinc-400">
          {refreshResult.started
            ? 'Ingestion started in background (25s response cap). Stats refresh automatically.'
            : `Last refresh: added=${refreshResult.added ?? 0} skipped=${refreshResult.skipped ?? 0} failed=${refreshResult.failed ?? 0}${refreshResult.alreadyRunning ? ' (already running)' : ''}`}
        </p>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Articles today" value={s?.articlesToday ?? '—'} tone="accent" icon={Activity} />
        <StatCard label="Articles total" value={s?.articlesTotal ?? '—'} />
        <StatCard label="Tools indexed" value={s?.toolsIndexed ?? '—'} icon={Wrench} />
        <StatCard
          label="Sources active"
          value={s ? `${s.sourcesActive}/${s.sourcesTotal}` : '—'}
          tone="green"
          icon={Rss}
        />
        <StatCard label="Failed (24h)" value={s?.failedFetches ?? '—'} tone={s?.failedFetches > 0 ? 'red' : 'neutral'} icon={AlertTriangle} />
        <StatCard label="Clustered dups" value={s?.duplicatesDetected ?? '—'} tone="amber" icon={Copy} />
      </section>

      <p className="-mt-6 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
        Last successful update: {s?.lastSuccessfulUpdate ? `${timeAgo(s.lastSuccessfulUpdate.replace(' ', 'T') + 'Z')}` : 'none yet'}
        {s?.ingestionRunning ? ' · ingestion running now…' : ''}
        {' '}· Models: {s?.modelsIndexed ?? '—'} · Papers: {s?.papersIndexed ?? '—'}
      </p>

      {/* Sources */}
      <section>
        <h2 className="mb-4 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
          Sources ({sources.length})
        </h2>
        <AddSourceForm onAdded={load} />
        <div className="mt-4 overflow-x-auto border border-line">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface2/60 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-500">
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sources.map((src) => (
                <tr key={src.id} className="bg-surface text-xs text-zinc-300">
                  <td className="px-3 py-2">
                    <p className="font-medium text-zinc-200">{src.name}</p>
                    <p className="max-w-[280px] truncate font-mono text-[10px] text-zinc-600">{src.feed_url}</p>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] uppercase text-zinc-500">{src.feed_type}</td>
                  <td className="px-3 py-2 font-mono tnum text-zinc-400">{src.priority}</td>
                  <td className="px-3 py-2">
                    <Badge tone={src.active ? 'green' : 'neutral'}>{src.active ? 'Active' : 'Paused'}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleSource(src)}
                        className="border border-line px-2 py-1 font-mono text-[10px] uppercase text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
                      >
                        {src.active ? 'Pause' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSource(src)}
                        aria-label={`Delete ${src.name}`}
                        className="border border-line p-1.5 text-zinc-500 hover:border-red-400/40 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Student offer metrics */}
      <section className="space-y-3">
        <h2 className="inline-flex items-center gap-2 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
          <GraduationCap size={12} className="text-accent" /> Student offers
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Active offers" value={s?.offersActive ?? '—'} tone="green" icon={CheckCircle2} />
          <StatCard label="Added this month" value={s?.offersAddedThisMonth ?? '—'} tone="accent" icon={Plus} />
          <StatCard label="Expiring soon" value={s?.offersExpiringSoon ?? '—'} tone="amber" icon={AlertTriangle} />
          <StatCard label="Need verification" value={s?.offersRequiringVerification ?? '—'} icon={GraduationCap} />
          <StatCard label="Expired" value={s?.offersExpired ?? '—'} tone={s?.offersExpired > 0 ? 'red' : 'neutral'} icon={XCircle} />
        </div>
        <OffersManager notify={notify} verifying={Boolean(s?.offersVerifying)} onStats={load} />
      </section>

      {/* Crawl logs */}
      <section>
        <h2 className="mb-4 border-b border-line pb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
          Ingestion log (last 20)
        </h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line bg-surface2/60 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-500">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Found</th>
                <th className="px-3 py-2 text-right">Added</th>
                <th className="px-3 py-2 text-right">Time</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(s?.crawlLogs || []).map((log) => {
                const meta = LOG_STATUS[log.status] || LOG_STATUS.empty;
                const Icon = meta.icon;
                return (
                  <tr key={log.id} className="bg-surface text-xs text-zinc-300">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-zinc-500 tnum">
                      {timeAgo(log.created_at.replace(' ', 'T') + 'Z')}
                    </td>
                    <td className="px-3 py-2 font-medium text-zinc-200">{log.source_name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase ${meta.cls}`}>
                        <Icon size={11} /> {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono tnum">{log.items_found}</td>
                    <td className="px-3 py-2 text-right font-mono tnum text-accent">{log.items_added}</td>
                    <td className="px-3 py-2 text-right font-mono tnum text-zinc-500">{log.duration_ms}ms</td>
                    <td className="max-w-[240px] truncate px-3 py-2 font-mono text-[10px] text-red-400/80">
                      {log.error || ''}
                    </td>
                  </tr>
                );
              })}
              {!s?.crawlLogs?.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-xs text-zinc-600">
                    No ingestion runs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 border border-accent/40 bg-surface px-4 py-2.5 text-xs text-zinc-200 shadow-xl shadow-black/50">
          {toast}
        </div>
      )}
    </div>
  );
}
