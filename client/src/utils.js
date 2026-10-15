export const NEWS_CATEGORIES = [
  'AI Models',
  'AI Research',
  'AI Agents',
  'AI Coding',
  'Generative AI',
  'Robotics',
  'Computer Vision',
  'AI Hardware',
  'Open Source',
  'AI Startups',
  'AI Business',
  'AI Safety',
  'AI Regulation',
  'Uncategorized',
];

export const TOOL_CATEGORIES = [
  'Research',
  'Coding',
  'AI Agents',
  'Image Generation',
  'Video Generation',
  'Audio',
  'Writing',
  'Productivity',
  'Design',
  'Marketing',
  'Education',
  'Business',
  '3D & Spatial',
  'Developer Infrastructure',
];

export const OFFER_CATEGORIES = [
  'Coding',
  'Research',
  'AI Models',
  'Design',
  'Image',
  'Video',
  'Cloud & Infrastructure',
  'Productivity',
  'Education',
];

export const OFFER_TYPES = [
  'Free for Students',
  'Student Discount',
  'Free Credits',
  'Education Plan',
  'Developer Credits',
  'Research Access',
  'Student Program',
  'Free Tier',
];

export const OFFER_STATUS = {
  active: { label: 'Active', emoji: '🟢', tone: 'green', dot: 'bg-emerald-400' },
  expiring: { label: 'Limited / Expiring Soon', emoji: '🟡', tone: 'amber', dot: 'bg-amber-300' },
  ongoing: { label: 'Ongoing Program', emoji: '🔵', tone: 'accent', dot: 'bg-accent' },
  verification: { label: 'Verification Required', emoji: '⚪', tone: 'neutral', dot: 'bg-zinc-400' },
  expired: { label: 'Expired', emoji: '🔴', tone: 'red', dot: 'bg-red-400' },
};

export function offerStatus(key) {
  return OFFER_STATUS[key] || OFFER_STATUS.verification;
}

// SQLite stores some timestamps as 'YYYY-MM-DD HH:MM:SS' (UTC) and others as ISO
// strings; normalize to a parseable ISO value before formatting.
export function toISO(value) {
  if (!value || typeof value !== 'string') return value || null;
  if (value.includes('T') || value.endsWith('Z')) return value;
  return `${value.replace(' ', 'T')}Z`;
}

const CATEGORY_STYLES = {
  'AI Models': { chip: 'bg-violet-400/10 text-violet-300', dot: 'bg-violet-400' },
  'AI Research': { chip: 'bg-blue-400/10 text-blue-300', dot: 'bg-blue-400' },
  'AI Agents': { chip: 'bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' },
  'AI Coding': { chip: 'bg-lime-400/10 text-lime-300', dot: 'bg-lime-400' },
  'Generative AI': { chip: 'bg-fuchsia-400/10 text-fuchsia-300', dot: 'bg-fuchsia-400' },
  Robotics: { chip: 'bg-orange-400/10 text-orange-300', dot: 'bg-orange-400' },
  'Computer Vision': { chip: 'bg-cyan-400/10 text-cyan-300', dot: 'bg-cyan-400' },
  'AI Hardware': { chip: 'bg-red-400/10 text-red-300', dot: 'bg-red-400' },
  'Open Source': { chip: 'bg-green-400/10 text-green-300', dot: 'bg-green-400' },
  'AI Startups': { chip: 'bg-pink-400/10 text-pink-300', dot: 'bg-pink-400' },
  'AI Business': { chip: 'bg-amber-400/10 text-amber-300', dot: 'bg-amber-400' },
  'AI Safety': { chip: 'bg-yellow-400/10 text-yellow-300', dot: 'bg-yellow-400' },
  'AI Regulation': { chip: 'bg-indigo-400/10 text-indigo-300', dot: 'bg-indigo-400' },
  Uncategorized: { chip: 'bg-zinc-400/10 text-zinc-400', dot: 'bg-zinc-400' },
};

const FALLBACK_STYLE = { chip: 'bg-zinc-400/10 text-zinc-400', dot: 'bg-zinc-400' };

export function categoryStyle(category) {
  return CATEGORY_STYLES[category] || FALLBACK_STYLE;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export function initials(name) {
  if (!name) return '?';
  const cleaned = String(name).replace(/[^\p{L}\p{N} ]/gu, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function compactNumber(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(num);
}

export function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? `${str.slice(0, len).trimEnd()}…` : str;
}
