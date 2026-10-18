import { useCallback, useEffect, useState } from 'react';
import {
  SealCheck as BadgeCheck,
  CheckCircle as CheckCircle2,
  CircleNotch as Loader2,
  PencilSimple as Pencil,
  Plus,
  ArrowClockwise as RefreshCw,
  Trash as Trash2,
  X,
  XCircle,
} from '@phosphor-icons/react';
import api from '../api';
import { StatusPill } from './StatusPill';
import { formatDate, toISO } from '../utils';

const EMPTY = {
  title: '',
  company_name: '',
  tool_name: '',
  official_url: '',
  offer_type: 'Student Program',
  category: 'Productivity',
  student_benefit: '',
  description: '',
  student_price: '',
  regular_price: '',
  discount_percentage: '',
  free_credits: '',
  eligibility: '',
  verification_method: '',
  geographic_restrictions: '',
  how_to_claim: '',
  important_conditions: '',
  expiration_date: '',
  status: 'verification',
  featured: 0,
  is_student_only: 1,
  tags: '',
};

const input =
  'h-9 border border-line bg-surface2 px-2.5 text-xs text-zinc-200 outline-none focus:border-accent/50 placeholder:text-zinc-600';
const area =
  'border border-line bg-surface2 px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-accent/50 placeholder:text-zinc-600';

function OfferForm({ meta, initial, onCancel, onSaved, notify }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const isEdit = Boolean(initial?.id);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...form,
      discount_percentage: form.discount_percentage === '' ? null : Number(form.discount_percentage),
      featured: form.featured ? 1 : 0,
      is_student_only: form.is_student_only ? 1 : 0,
      how_to_claim: form.how_to_claim
        ? form.how_to_claim.split('\n').map((s) => s.trim()).filter(Boolean)
        : [],
      tags: form.tags ? form.tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      expiration_date: form.expiration_date || null,
    };
    try {
      if (isEdit) await api.admin.patchOffer(form.id, payload);
      else await api.admin.addOffer(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 border border-accent/30 bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          {isEdit ? 'Edit offer' : 'Add offer'}
        </p>
        <button type="button" onClick={onCancel} aria-label="Cancel" className="text-zinc-500 hover:text-zinc-200">
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <input required className={input} placeholder="Offer title *" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <input className={input} placeholder="Company name" value={form.company_name || ''} onChange={(e) => set('company_name', e.target.value)} />
        <input className={input} placeholder="Tool name (optional)" value={form.tool_name || ''} onChange={(e) => set('tool_name', e.target.value)} />
        <input required className={`${input} sm:col-span-2 lg:col-span-2`} placeholder="Official URL (https://…) *" value={form.official_url} onChange={(e) => set('official_url', e.target.value)} />
        <select className={input} value={form.offer_type} onChange={(e) => set('offer_type', e.target.value)}>
          {meta.types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className={input} value={form.category} onChange={(e) => set('category', e.target.value)}>
          {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className={input} value={form.status} onChange={(e) => set('status', e.target.value)}>
          {meta.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className={input} placeholder="Student price" value={form.student_price || ''} onChange={(e) => set('student_price', e.target.value)} />
        <input className={input} placeholder="Student benefit" value={form.student_benefit || ''} onChange={(e) => set('student_benefit', e.target.value)} />
        <input className={input} placeholder="Regular price" value={form.regular_price || ''} onChange={(e) => set('regular_price', e.target.value)} />
        <input type="number" min="0" max="100" className={input} placeholder="Discount % (0-100)" value={form.discount_percentage} onChange={(e) => set('discount_percentage', e.target.value)} />
        <input className={input} placeholder="Free credits" value={form.free_credits || ''} onChange={(e) => set('free_credits', e.target.value)} />
        <input type="date" className={input} value={form.expiration_date || ''} onChange={(e) => set('expiration_date', e.target.value)} />
        <input className={input} placeholder="Eligibility" value={form.eligibility || ''} onChange={(e) => set('eligibility', e.target.value)} />
        <input className={input} placeholder="Verification method" value={form.verification_method || ''} onChange={(e) => set('verification_method', e.target.value)} />
        <input className={input} placeholder="Geographic restrictions" value={form.geographic_restrictions || ''} onChange={(e) => set('geographic_restrictions', e.target.value)} />
      </div>

      <textarea className={`${area} w-full`} rows={2} placeholder="Short description" value={form.description || ''} onChange={(e) => set('description', e.target.value)} />
      <textarea className={`${area} w-full`} rows={3} placeholder="How to claim — one step per line" value={form.how_to_claim || ''} onChange={(e) => set('how_to_claim', e.target.value)} />
      <textarea className={`${area} w-full`} rows={2} placeholder="Important conditions" value={form.important_conditions || ''} onChange={(e) => set('important_conditions', e.target.value)} />
      <input className={`${input} w-full`} placeholder="Tags (comma-separated)" value={form.tags || ''} onChange={(e) => set('tags', e.target.value)} />

      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          <input type="checkbox" className="h-3 w-3 accent-[var(--color-accent)]" checked={Boolean(form.featured)} onChange={(e) => set('featured', e.target.checked)} />
          Featured pick
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          <input type="checkbox" className="h-3 w-3 accent-[var(--color-accent)]" checked={Boolean(form.is_student_only)} onChange={(e) => set('is_student_only', e.target.checked)} />
          Student-only (not a general free tier)
        </label>
      </div>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="inline-flex h-9 items-center gap-1.5 bg-accent px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-ink hover:opacity-90 disabled:opacity-50">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} {isEdit ? 'Save changes' : 'Add offer'}
        </button>
        <button type="button" onClick={onCancel} className="h-9 border border-line px-3 font-mono text-[11px] uppercase tracking-wider text-zinc-400 hover:text-zinc-100">
          Cancel
        </button>
      </div>
    </form>
  );
}

function toForm(o) {
  const parse = (v) => (Array.isArray(v) ? v : (() => { try { return JSON.parse(v || '[]'); } catch { return []; } })());
  return {
    ...EMPTY,
    ...o,
    discount_percentage: o.discount_percentage ?? '',
    how_to_claim: parse(o.how_to_claim).join('\n'),
    tags: parse(o.tags).join(', '),
    expiration_date: o.expiration_date ? String(o.expiration_date).slice(0, 10) : '',
    featured: o.featured ? 1 : 0,
    is_student_only: o.is_student_only ? 1 : 0,
  };
}

export function OffersManager({ notify, verifying, onStats }) {
  const [meta, setMeta] = useState({ types: [], categories: [], statuses: [] });
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | offer object
  const [busyAll, setBusyAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, list] = await Promise.all([api.admin.offerMeta(), api.admin.getOffers({ pageSize: 200 })]);
      setMeta(m);
      setOffers(list.items || []);
    } catch (err) {
      notify(err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn, msg) => {
    try {
      await fn();
      notify(msg);
      await load();
      onStats?.();
    } catch (err) {
      notify(err.message);
    }
  };

  const verifyAll = async () => {
    setBusyAll(true);
    try {
      const r = await api.admin.verifyAllOffers();
      notify(
        r?.alreadyRunning
          ? 'Verification already running…'
          : r?.started
            ? 'Verification running in background…'
            : `Verification done: checked ${r?.checked ?? 0}, downgraded ${r?.downgraded ?? 0}`
      );
      await load();
      onStats?.();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusyAll(false);
    }
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-400">
          Student offers ({offers.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={verifyAll}
            disabled={busyAll || verifying}
            className="inline-flex items-center gap-1.5 border border-line bg-surface2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-300 hover:border-accent/50 hover:text-accent disabled:opacity-50"
          >
            {busyAll || verifying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {verifying ? 'Verifying…' : 'Verify all now'}
          </button>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink hover:opacity-90"
          >
            <Plus size={12} /> Add offer
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-4">
          <OfferForm
            meta={meta}
            initial={editing === 'new' ? null : toForm(editing)}
            onCancel={() => setEditing(null)}
            onSaved={() => { setEditing(null); act(async () => {}, 'Offer saved'); }}
            notify={notify}
          />
        </div>
      )}

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-line bg-surface2/60 font-mono text-[9px] uppercase tracking-[0.15em] text-zinc-500">
              <th className="px-3 py-2">Offer</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last verified</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {offers.map((o) => (
              <tr key={o.id} className="bg-surface text-xs text-zinc-300">
                <td className="px-3 py-2">
                  <p className="font-medium text-zinc-200">
                    {o.title}
                    {o.featured === 1 && <span className="ml-1.5 font-mono text-[9px] uppercase text-accent">pick</span>}
                  </p>
                  <p className="max-w-[320px] truncate font-mono text-[10px] text-zinc-600">
                    {o.company_name || o.tool_name || '—'} · {o.official_url}
                  </p>
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{o.offer_type}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-zinc-500">{o.category}</td>
                <td className="px-3 py-2"><StatusPill status={o.status} /></td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-zinc-500 tnum">
                  {o.last_verified_at ? formatDate(toISO(o.last_verified_at)) : 'never'}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1.5">
                    <button type="button" onClick={() => setEditing(o)} aria-label={`Edit ${o.title}`}
                      className="border border-line p-1.5 text-zinc-500 hover:border-zinc-500 hover:text-zinc-100">
                      <Pencil size={12} />
                    </button>
                    <button type="button" onClick={() => act(() => api.admin.verifyOffer(o.id, {}), `Marked verified: ${o.title}`)}
                      aria-label={`Verify ${o.title}`} title="Mark verified"
                      className="border border-line p-1.5 text-zinc-500 hover:border-emerald-400/40 hover:text-emerald-700">
                      <BadgeCheck size={12} />
                    </button>
                    <button type="button" onClick={() => act(() => api.admin.expireOffer(o.id), `Marked expired: ${o.title}`)}
                      aria-label={`Expire ${o.title}`} title="Mark expired"
                      className="border border-line p-1.5 text-zinc-500 hover:border-amber-400/40 hover:text-amber-700">
                      <XCircle size={12} />
                    </button>
                    <button type="button"
                      onClick={() => { if (window.confirm(`Remove offer "${o.title}"?`)) act(() => api.admin.deleteOffer(o.id), 'Offer removed'); }}
                      aria-label={`Delete ${o.title}`} title="Delete"
                      className="border border-line p-1.5 text-zinc-500 hover:border-red-400/40 hover:text-red-700">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && offers.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-zinc-600">No offers yet.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-zinc-600">Loading offers…</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-zinc-600">
        <CheckCircle2 size={11} /> Marking verified sets the last-verified date and status. The nightly job only
        downgrades status when an official page is unreachable — it never auto-promotes an offer to active.
      </p>
    </section>
  );
}
