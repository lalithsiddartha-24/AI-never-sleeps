// Shared utilities: slugify, tokenization, Jaccard similarity, date helpers.

import { decodeHTML } from 'entities';

export function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'item';
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'it', 'its', 'this', 'that',
  'these', 'those', 'as', 'at', 'by', 'from', 'into', 'over', 'after', 'before',
  'how', 'what', 'why', 'who', 'which', 'new', 'news', 'ai', ' announces', 'you',
  'your', 'our', 'their', 'his', 'her', 'will', 'can', 'about', 'up', 'out', 'off',
  'than', 'then', 'so', 'such', 'not', 'no', 'do', 'does', 'did', 'has', 'have',
  'had', 'all', 'any', 'more', 'most', 'some', 'now', 'we', 'us', 'they', 'he', 'she'
]);

export function tokenizeTitle(title) {
  return new Set(
    String(title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOPWORDS.has(t))
  );
}

export function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function toISODate(d) {
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

export function daysBetween(isoA, isoB) {
  const a = new Date(isoA).getTime();
  const b = new Date(isoB).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return Infinity;
  return Math.abs(a - b) / (1000 * 60 * 60 * 24);
}

export function parseJSON(str, fallback) {
  try {
    const v = JSON.parse(str);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

// Decode HTML entities (numeric, hex, named — with or without trailing semicolon)
// that leak through RSS/Atom content. Delegates to the `entities` package, which
// covers the full HTML5 entity table; unknown references are left untouched.
export function decodeEntities(str) {
  const s = String(str || '');
  if (s.indexOf('&') === -1) return s;
  try {
    return decodeHTML(s);
  } catch {
    return s;
  }
}

export function stripHtml(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)\s*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
