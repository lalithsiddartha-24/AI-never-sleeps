// Fetchers: normalize RSS/Atom, arXiv Atom API and GitHub REST responses
// into a common item shape:
// { title, url, author, published_at (ISO), content (plain text), content_html,
//   image_url, tags[], extra }

import Parser from 'rss-parser';
import { stripHtml, toISODate } from '../utils.js';

const UA = 'Mozilla/5.0 (compatible; AI-Intelligence-Hub/1.0; +https://github.com/local)';

const parser = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
  customFields: {
    item: [
      ['dc:creator', 'dcCreator'],
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['arxiv:primary_category', 'arxivPrimaryCategory'],
      ['arxiv:comment', 'arxivComment'],
      ['author', 'atomAuthors', { keepArray: true }]
    ]
  }
});

// Extract all author names from an Atom entry. rss-parser only surfaces the first
// author as `item.author`, so we read the raw `atomAuthors` array when present.
function extractAuthors(item) {
  const raw = item.atomAuthors;
  if (Array.isArray(raw) && raw.length) {
    const names = raw
      .map((a) => {
        if (typeof a === 'string') return a;
        if (a && typeof a === 'object') {
          const n = a.name;
          if (typeof n === 'string') return n;
          if (Array.isArray(n) && typeof n[0] === 'string') return n[0];
          if (n && typeof n === 'object' && typeof n._ === 'string') return n._;
        }
        return null;
      })
      .map((s) => (s || '').trim())
      .filter(Boolean);
    if (names.length) return names;
  }
  const fallback = asText(item.creator) || asText(item.dcCreator) || asText(item.author) || '';
  return fallback.split(',').map((s) => s.trim()).filter(Boolean);
}

function pickImage(item) {
  if (item.enclosure && item.enclosure.url && /^image\//.test(item.enclosure.type || '')) return item.enclosure.url;
  if (Array.isArray(item.mediaContent) && item.mediaContent.length) {
    const img = item.mediaContent.find((m) => m && m.$ && (m.$.medium === 'image' || /^image\//.test(m.$.type || '')));
    if (img && img.$ && img.$.url) return img.$.url;
    if (item.mediaContent[0] && item.mediaContent[0].$ && item.mediaContent[0].$.url) return item.mediaContent[0].$.url;
  }
  if (Array.isArray(item.mediaThumbnail) && item.mediaThumbnail.length && item.mediaThumbnail[0].$) return item.mediaThumbnail[0].$.url;
  const html = item['content:encoded'] || item.content || item.summary || '';
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

// Some feeds expose fields as objects ({ $: attrs, _: text }) — coerce safely.
function asText(v) {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && typeof v._ === 'string') return v._;
  if (v && typeof v === 'object' && Array.isArray(v) && typeof v[0] === 'string') return v[0];
  return null;
}

function normalizeRssItem(item) {
  const html = asText(item.contentEncoded) || asText(item['content:encoded']) || asText(item.content) || asText(item.summary) || asText(item.description) || '';
  const published = toISODate(item.isoDate || item.pubDate || item.date);
  return {
    title: stripHtml(asText(item.title) || '').slice(0, 500),
    url: asText(item.link) || asText(item.guid) || null,
    author: asText(item.dcCreator) || asText(item.creator) || asText(item['dc:creator']) || asText(item.author) || null,
    published_at: published,
    content: stripHtml(html).slice(0, 20000),
    content_html: String(html).slice(0, 30000),
    image_url: pickImage(item),
    tags: Array.isArray(item.categories) ? item.categories.slice(0, 8) : [],
    extra: {}
  };
}

// RSS / Atom feeds (also used for arXiv's Atom API output)
export async function fetchRss(source) {
  const feed = await parser.parseURL(source.feed_url);
  const items = (feed.items || []).map((item) => {
    const base = normalizeRssItem(item);
    if (source.feed_type === 'arxiv') {
      // arXiv Atom entries: <id> is the abs URL, creator holds comma-separated authors.
      if (!base.url && item.id) base.url = String(item.id).trim();
      if (item.id && /^http/.test(String(item.id).trim())) base.url = String(item.id).trim();
      const authors = extractAuthors(item);
      base.extra = {
        arxiv_id: String(item.id || '').replace(/.*\/abs\//, '').replace(/v\d+$/, ''),
        authors,
        primary_category: item.arxivPrimaryCategory && item.arxivPrimaryCategory.$
          ? item.arxivPrimaryCategory.$.term
          : (base.tags[0] || null),
        categories: base.tags,
        comment: item.arxivComment || null
      };
      if (authors.length) base.author = authors[0] + (authors.length > 1 ? ` +${authors.length - 1}` : '');
      base.image_url = null;
    }
    return base;
  }).filter((it) => it.title && it.url);
  return items;
}

// GitHub repository search REST API
export async function fetchGitHub(source) {
  const res = await fetch(source.feed_url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
    },
    signal: AbortSignal.timeout(20000)
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);
  const data = await res.json();
  const repos = Array.isArray(data.items) ? data.items : [];
  return repos.map((repo) => {
    const description = repo.description || '';
    const topics = Array.isArray(repo.topics) ? repo.topics : [];
    const content = [
      description,
      topics.length ? `Topics: ${topics.join(', ')}.` : '',
      `Language: ${repo.language || 'unknown'}. Stars: ${repo.stargazers_count}. Forks: ${repo.forks_count}.`,
      repo.license && repo.license.name ? `License: ${repo.license.name}.` : '',
      `Last updated ${repo.updated_at}. Created ${repo.created_at}.`
    ].filter(Boolean).join(' ');
    return {
      title: `${repo.full_name}: ${description || 'AI repository'}`.slice(0, 480),
      url: repo.html_url,
      author: repo.owner ? repo.owner.login : null,
      published_at: toISODate(repo.updated_at),
      content: content.slice(0, 20000),
      content_html: null,
      image_url: repo.owner ? repo.owner.avatar_url : null,
      tags: topics.slice(0, 6),
      extra: {
        stars: repo.stargazers_count,
        language: repo.language,
        homepage: repo.homepage,
        created_at: repo.created_at
      }
    };
  }).filter((it) => it.title && it.url);
}

export async function fetchSource(source) {
  switch (source.feed_type) {
    case 'github':
      return fetchGitHub(source);
    case 'arxiv':
    case 'atom':
    case 'rss':
    default:
      return fetchRss(source);
  }
}
