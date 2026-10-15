// Ingestion pipeline: fetch → validate → dedupe (exact + near-duplicate) →
// classify → summarize (extractive, or OpenAI if OPENAI_API_KEY is set) →
// insert → crawl_logs. Never crashes the run: every source is wrapped in try/catch.

import { fetchSource } from './fetchers.js';
import { slugify, tokenizeTitle, jaccardSimilarity, toISODate, sleep, stripHtml } from '../utils.js';
import db from '../db.js';

const MAX_AGE_DAYS = 30;
const SOURCE_DELAY_MS = 1500;
const SIMILARITY_THRESHOLD = 0.75;

const CATEGORIES = [
  'AI Models', 'AI Research', 'AI Agents', 'AI Coding', 'Generative AI', 'Robotics',
  'Computer Vision', 'AI Hardware', 'Open Source', 'AI Startups', 'AI Business',
  'AI Safety', 'AI Regulation', 'Uncategorized'
];

// Ordered keyword rules — first match wins.
const CATEGORY_RULES = [
  [/\b(robot|robotic|humanoid|embodied|manipulat)\w*\b/i, 'Robotics'],
  [/\b(computer vision|image recognition|segmentation|object detect|3d reconstruction|video understanding)\b/i, 'Computer Vision'],
  [/\b(chip|gpu|tpu|npu|semiconductor|hardware|wafer|datacenter|data center|supercomputer|accelerator|cuda|blackwell|rubin)\w*\b/i, 'AI Hardware'],
  [/\b(regulation|regulator|law|congress|senate|eu ai act|ai act|antitrust|ftc|copyright|lawsuit|compliance|ban(ned)?|legislation|policy maker)\b/i, 'AI Regulation'],
  [/\b(safety|alignment|interpretability|jailbreak|misuse|red[- ]team|existential risk|superintelligence risk)\b/i, 'AI Safety'],
  [/\b(funding|raise[sd]?|series [a-f]\b|valuation|acquisition|acquire[sd]?|ipo|startup|venture|invest(ors?|ment)?)\b/i, 'AI Startups'],
  [/\b(agent|agents|agentic|autonomous|multi-agent|orchestrat\w+)\b/i, 'AI Agents'],
  [/\b(copilot|coding|code editor|\bide\b|program(m)?ing|software engineer|codebase|pull request|swe-bench|developer tool)\b/i, 'AI Coding'],
  [/\b(paper|arxiv|benchmark|research(study|ers)?|dataset|evaluation|state-of-the-art|pre-?print)\b/i, 'AI Research'],
  [/\b(gpt-?\d|gemini|claude|llama|mistral|grok|deepseek|qwen|model release|llm|language model|foundation model|open[- ]weights?)\b/i, 'AI Models'],
  [/\b(open[- ]source|github|hugging face|repository|weights released|permissive license)\b/i, 'Open Source'],
  [/\b(image|video|generat\w+|diffusion|text-to-\w+|sora|midjourney|music|audio|voice|speech|synthesis|animation)\b/i, 'Generative AI'],
  [/\b(business|enterprise|partnership|revenue|customers?|deployment|pricing|market)\b/i, 'AI Business']
];

export function classifyCategory(text, fallback = 'Uncategorized') {
  const sample = String(text || '').slice(0, 600);
  for (const [re, cat] of CATEGORY_RULES) {
    if (re.test(sample)) return cat;
  }
  return fallback;
}

const SUM_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'it', 'its', 'this', 'that', 'these', 'those', 'as',
  'at', 'by', 'from', 'into', 'over', 'after', 'before', 'how', 'what', 'why', 'who', 'which',
  'you', 'your', 'our', 'their', 'his', 'her', 'will', 'can', 'about', 'up', 'out', 'off',
  'than', 'then', 'so', 'such', 'not', 'no', 'do', 'does', 'did', 'has', 'have', 'had', 'all',
  'any', 'more', 'most', 'some', 'now', 'we', 'us', 'they', 'he', 'she', 'also', 'there', 'when',
  'where', 'while', 'if', 'only', 'just', 'very', 'each', 'both', 'other', 'one', 'two', 'new',
  'using', 'use', 'used', 'may', 'might', 'must', 'should', 'would', 'could', 'via', 'per',
  'including', 'include', 'includes', 'based', 'across', 'during', 'within', 'without', 'against'
]);

function words(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SUM_STOPWORDS.has(w));
}

function splitSentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 6 && s.length <= 400);
}

// Grounded extractive summarizer: only ever uses sentences present in `content`.
export function extractiveSummarize(content, title) {
  const sentences = splitSentences(content);
  if (!sentences.length) {
    const flat = stripHtml(content).trim();
    return {
      summary: flat ? flat.slice(0, 280) : (title || '').slice(0, 280),
      key_takeaways: flat ? [flat.slice(0, 160)] : [],
      why_it_matters: null,
      tags: words(`${title || ''} ${flat}`).slice(0, 5).filter((v, i, arr) => arr.indexOf(v) === i)
    };
  }

  // Word frequency scoring
  const freq = new Map();
  for (const w of words(content)) freq.set(w, (freq.get(w) || 0) + 1);
  const maxFreq = Math.max(...freq.values(), 1);
  const titleWords = new Set(words(title));

  const scored = sentences.map((s, idx) => {
    const sw = words(s);
    if (!sw.length) return { s, idx, score: 0 };
    let score = sw.reduce((acc, w) => acc + (freq.get(w) || 0) / maxFreq, 0) / Math.sqrt(sw.length);
    for (const w of sw) if (titleWords.has(w)) { score += 0.15; break; }
    if (idx < 3) score += 0.1; // bias toward lede
    return { s, idx, score };
  });

  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 6);
  const summarySentences = top.slice(0, 3).sort((a, b) => a.idx - b.idx).map((x) => x.s);
  const summary = summarySentences.join(' ').slice(0, 600);

  const takeaways = top.slice(0, 4).sort((a, b) => a.idx - b.idx).map((x) => x.s.slice(0, 200)).slice(0, 3);

  const whyCandidate = scored.find((x) =>
    /\b(because|means|could|impact|significant|matters|important|critical|first|enables?|allows?)\b/i.test(x.s)
  ) || top[0];
  const why_it_matters = whyCandidate ? whyCandidate.s.slice(0, 240) : null;

  // Tags: top-frequency distinctive words (+ capitalized phrases from title)
  const tagFreq = new Map();
  for (const w of words(`${title || ''} ${title || ''} ${content.slice(0, 4000)}`)) {
    tagFreq.set(w, (tagFreq.get(w) || 0) + 1);
  }
  const tags = [...tagFreq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([w]) => w)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);

  return { summary, key_takeaways: takeaways, why_it_matters, tags };
}

const IMPORTANCE_BOOST = /\b(launch|launches|release[sd]?|breakthrough|introduc\w+|announc\w+|unveil\w+|state-of-the-art|record|first)\b/i;

export function importanceHeuristic(source, title, category) {
  let score = 2;
  const priority = Number(source && source.priority) || 3;
  if (priority >= 5) score += 2;
  else if (priority === 4) score += 1;
  if (source && (source.category === 'official' || source.category === 'research')) score += 1;
  if (IMPORTANCE_BOOST.test(String(title || ''))) score += 1;
  if (category === 'AI Models' || category === 'AI Hardware') score += 0.5;
  return Math.max(1, Math.min(5, Math.round(score)));
}

// Optional OpenAI-powered enrichment; strictly grounded, falls back to extractive.
async function openaiSummarize(item, extractive) {
  if (!process.env.OPENAI_API_KEY) return extractive;
  try {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You summarize news articles for an AI news hub. STRICT GROUNDING RULES: use ONLY facts present in the provided article text. Never invent facts, numbers, quotes, dates or entities not in the text. If information is missing, omit it. Respond with JSON: {"summary": string (2-3 sentences), "key_takeaways": string[3], "why_it_matters": string (1 sentence), "category": one of [' + CATEGORIES.map((c) => `"${c}"`).join(', ') + '], "tags": string[3-5] lowercase keywords}.'
        },
        {
          role: 'user',
          content: `Title: ${item.title}\nSource: ${item.sourceName}\nPublished: ${item.published_at}\nArticle text:\n${(item.content || '').slice(0, 12000)}`
        }
      ]
    });
    const raw = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.summary !== 'string' || !parsed.summary.trim()) return extractive;
    return {
      summary: parsed.summary.slice(0, 600),
      key_takeaways: Array.isArray(parsed.key_takeaways) ? parsed.key_takeaways.slice(0, 3).map(String) : extractive.key_takeaways,
      why_it_matters: typeof parsed.why_it_matters === 'string' ? parsed.why_it_matters.slice(0, 240) : extractive.why_it_matters,
      category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map(String) : extractive.tags
    };
  } catch (err) {
    console.warn('[pipeline] OpenAI enrichment failed, falling back to extractive:', err.message);
    return extractive;
  }
}

// ---- Near-duplicate detection ----
function loadRecentTitles() {
  const rows = db.prepare(`
    SELECT id, title, cluster_id FROM news
    WHERE hidden = 0 AND (
      published_at >= datetime('now', '-${MAX_AGE_DAYS} days')
      OR created_at >= datetime('now', '-${MAX_AGE_DAYS} days')
    )
    ORDER BY id DESC LIMIT 3000
  `).all();
  return rows.map((r) => ({ id: r.id, tokens: tokenizeTitle(r.title), cluster_id: r.cluster_id }));
}

function findNearDuplicate(recent, title) {
  const tokens = tokenizeTitle(title);
  if (!tokens.size) return null;
  let best = null;
  let bestSim = 0;
  for (const cand of recent) {
    const sim = jaccardSimilarity(tokens, cand.tokens);
    if (sim >= SIMILARITY_THRESHOLD && sim > bestSim) {
      bestSim = sim;
      best = cand;
    }
  }
  return best ? { id: best.id, cluster_id: best.cluster_id, similarity: bestSim } : null;
}

function uniqueSlug(base, url) {
  let slug = slugify(base);
  const exists = db.prepare('SELECT 1 FROM news WHERE slug = ?');
  if (!exists.get(slug)) return slug;
  let hash = 0;
  for (const ch of String(url)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  slug = `${slug}-${hash.toString(36).slice(0, 6)}`;
  if (!exists.get(slug)) return slug;
  let i = 2;
  while (exists.get(`${slug}-${i}`)) i++;
  return `${slug}-${i}`;
}

// ---- Statements ----
const stmts = {
  insertNews: null,
  setCluster: null,
  insertLog: null,
  insertPaper: null,
  paperExists: null,
  tagInsert: null,
  tagId: null,
  tagLink: null
};

function prepareStatements() {
  if (stmts.insertNews) return;
  stmts.insertNews = db.prepare(`INSERT INTO news
    (title, slug, summary, key_takeaways, why_it_matters, content_snippet, source_id, source_name,
     source_slug, source_logo_url, source_url, image_url, author, published_at, category, tags,
     importance, cluster_id, is_seed)
    VALUES (@title, @slug, @summary, @key_takeaways, @why_it_matters, @content_snippet, @source_id,
     @source_name, @source_slug, @source_logo_url, @source_url, @image_url, @author, @published_at,
     @category, @tags, @importance, @cluster_id, 0)`);
  stmts.setCluster = db.prepare('UPDATE news SET cluster_id = ?, updated_at = datetime(\'now\') WHERE id = ?');
  stmts.insertLog = db.prepare(`INSERT INTO crawl_logs
    (source_id, source_name, status, items_found, items_added, error, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  stmts.paperExists = db.prepare('SELECT 1 FROM research_papers WHERE arxiv_id = ? OR slug = ?');
  stmts.insertPaper = db.prepare(`INSERT INTO research_papers
    (arxiv_id, title, slug, authors, abstract, summary, url, pdf_url, published_at, primary_category, tags, company_slug)
    VALUES (@arxiv_id, @title, @slug, @authors, @abstract, @summary, @url, @pdf_url, @published_at, @primary_category, @tags, NULL)`);
  stmts.tagInsert = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  stmts.tagId = db.prepare('SELECT id FROM tags WHERE name = ?');
  stmts.tagLink = db.prepare('INSERT OR IGNORE INTO news_tags (news_id, tag_id) VALUES (?, ?)');
}

let running = false;

export function isIngestionRunning() {
  return running;
}

export async function runIngestion({ delayMs = SOURCE_DELAY_MS } = {}) {
  if (running) {
    console.log('[pipeline] ingestion already running; skipping');
    return { ok: false, alreadyRunning: true, added: 0, skipped: 0, failed: 0 };
  }
  running = true;
  prepareStatements();
  const totals = { ok: true, added: 0, skipped: 0, failed: 0, sources: 0 };
  const startedAt = Date.now();
  console.log('[pipeline] ingestion run starting');

  let sources = [];
  try {
    sources = db.prepare('SELECT * FROM sources WHERE active = 1 ORDER BY priority DESC, id ASC').all();
  } catch (err) {
    console.error('[pipeline] failed to load sources:', err.message);
    running = false;
    return { ok: false, error: err.message, added: 0, skipped: 0, failed: 0 };
  }

  let first = true;
  for (const source of sources) {
    if (!first) await sleep(delayMs);
    first = false;
    const srcStart = Date.now();
    let status = 'ok';
    let itemsFound = 0;
    let itemsAdded = 0;
    let error = null;

    try {
      const items = await fetchSource(source);
      itemsFound = items.length;
      if (!items.length) {
        status = 'empty';
      } else {
        const recent = loadRecentTitles();
        const now = Date.now();
        for (const item of items) {
          try {
            // Validate URL
            let url;
            try {
              url = new URL(item.url);
              if (!/^https?:$/.test(url.protocol)) throw new Error('bad protocol');
            } catch {
              totals.skipped++;
              continue;
            }
            // Validate timestamp: skip >30 days old and future-dated (>2h tolerance)
            let published = item.published_at ? toISODate(item.published_at) : null;
            if (published) {
              const t = new Date(published).getTime();
              if (Number.isNaN(t) || t > now + 2 * 3600 * 1000 || t < now - MAX_AGE_DAYS * 24 * 3600 * 1000) {
                totals.skipped++;
                continue;
              }
            } else {
              published = new Date(now).toISOString();
            }

            // Enrichment
            const textForCategory = `${item.title} ${(item.content || '').slice(0, 400)} ${(item.tags || []).join(' ')}`;
            let category;
            if (source.feed_type === 'github') category = 'Open Source';
            else if (source.feed_type === 'arxiv') category = classifyCategory(textForCategory, 'AI Research');
            else category = classifyCategory(textForCategory);

            const extractive = extractiveSummarize(item.content || '', item.title);
            const enriched = await openaiSummarize(
              { ...item, sourceName: source.name, published_at: published },
              extractive
            );
            if (enriched.category && CATEGORIES.includes(enriched.category)) category = enriched.category;

            const importance = importanceHeuristic(source, item.title, category);

            // Near-duplicate detection vs recent articles
            const dup = findNearDuplicate(recent, item.title);
            let clusterId = null;
            if (dup) {
              clusterId = dup.cluster_id != null ? dup.cluster_id : dup.id;
              if (dup.cluster_id == null) stmts.setCluster.run(dup.id, dup.id);
            }

            const tags = (enriched.tags && enriched.tags.length ? enriched.tags : extractive.tags).slice(0, 5);
            const slug = uniqueSlug(item.title, url.href);
            let newsId;
            try {
              const info = stmts.insertNews.run({
                title: item.title.slice(0, 490),
                slug,
                summary: enriched.summary || null,
                key_takeaways: JSON.stringify(enriched.key_takeaways || []),
                why_it_matters: enriched.why_it_matters || null,
                content_snippet: (item.content || '').slice(0, 4000),
                source_id: source.id,
                source_name: source.name,
                source_slug: source.slug,
                source_logo_url: source.logo_url || null,
                source_url: url.href,
                image_url: item.image_url || null,
                author: item.author || null,
                published_at: published,
                category,
                tags: JSON.stringify(tags),
                importance,
                cluster_id: clusterId
              });
              newsId = info.lastInsertRowid;
            } catch (err) {
              if (/UNIQUE/i.test(err.message)) {
                totals.skipped++; // exact source_url (or slug) duplicate
                continue;
              }
              throw err;
            }

            // Maintain tags table
            for (const tag of tags) {
              const name = String(tag).toLowerCase().slice(0, 40);
              if (!name) continue;
              stmts.tagInsert.run(name);
              const row = stmts.tagId.get(name);
              if (row) stmts.tagLink.run(newsId, row.id);
            }

            // arXiv items also populate research_papers (deduped by arxiv_id)
            if (source.feed_type === 'arxiv' && item.extra && item.extra.arxiv_id) {
              try {
                const paperSlug = uniqueSlug(item.title, url.href);
                if (!stmts.paperExists.get(item.extra.arxiv_id, paperSlug)) {
                  stmts.insertPaper.run({
                    arxiv_id: item.extra.arxiv_id,
                    title: item.title,
                    slug: paperSlug,
                    authors: JSON.stringify(item.extra.authors || []),
                    abstract: (item.content || enriched.summary || '').slice(0, 6000),
                    summary: (enriched.summary || '').slice(0, 600),
                    url: url.href,
                    pdf_url: url.href.replace('/abs/', '/pdf/'),
                    published_at: published,
                    primary_category: item.extra.primary_category || null,
                    tags: JSON.stringify(tags)
                  });
                }
              } catch (err) {
                console.warn('[pipeline] research_papers insert failed:', err.message);
              }
            }

            if (clusterId != null) {
              recent.push({ id: newsId, tokens: tokenizeTitle(item.title), cluster_id: clusterId });
            } else {
              recent.push({ id: newsId, tokens: tokenizeTitle(item.title), cluster_id: null });
            }
            itemsAdded++;
            totals.added++;
          } catch (itemErr) {
            console.warn(`[pipeline] item failed (${source.name}):`, itemErr.message);
            totals.skipped++;
          }
        }
      }
    } catch (err) {
      status = 'error';
      error = String(err && err.message ? err.message : err).slice(0, 500);
      totals.failed++;
    }

    const duration = Date.now() - srcStart;
    try {
      stmts.insertLog.run(source.id, source.name, status, itemsFound, itemsAdded, error, duration);
    } catch (logErr) {
      console.warn('[pipeline] crawl_log insert failed:', logErr.message);
    }
    totals.sources++;
    console.log(`[pipeline] ${source.name}: ${status} found=${itemsFound} added=${itemsAdded}${error ? ` err=${error}` : ''} (${duration}ms)`);
  }

  console.log(`[pipeline] run finished in ${Date.now() - startedAt}ms — added=${totals.added} skipped=${totals.skipped} failed=${totals.failed}`);
  running = false;
  return totals;
}
