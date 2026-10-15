import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Minimal stopwords — kept tiny so meaningful terms like "free" and "ai" survive.
const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'for', 'on', 'in', 'with', 'is', 'are']);

// Split a query into up to 5 distinct search tokens (alnum, len >= 2).
function tokenize(q) {
  const words = String(q || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 5);
}

// Build a WHERE fragment requiring EVERY token to appear in at least one of `fields`.
// Reuses one named param per token (@t0, @t1, …) so callers pass a single params object.
function matchAll(tokens, fields) {
  if (!tokens.length) return { sql: '1=1', params: {} };
  const params = {};
  const clauses = tokens.map((tok, i) => {
    params[`t${i}`] = `%${tok}%`;
    const ors = fields.map((f) => `${f} LIKE @t${i}`);
    return `(${ors.join(' OR ')})`;
  });
  return { sql: clauses.join(' AND '), params };
}

// Relevance: count how many tokens matched, so best matches sort first.
function relevance(tokens, fields) {
  if (!tokens.length) return '0';
  return tokens
    .map((_, i) => `(CASE WHEN ${fields.map((f) => `${f} LIKE @t${i}`).join(' OR ')} THEN 1 ELSE 0 END)`)
    .join(' + ');
}

const FIELDS = {
  news: ['title', 'summary', 'tags', 'source_name', 'category'],
  tools: ['name', 'description', 'category', 'tags', 'company_name'],
  models: ['name', 'developer', 'description', 'model_type'],
  companies: ['name', 'description', 'focus_areas'],
  research: ['title', 'abstract', 'summary', 'authors', 'tags'],
  offers: ['title', 'student_benefit', 'description', 'company_name', 'tool_name', 'category', 'eligibility', 'tags']
};

// GET /api/search?q=...&limit=6 → { news, tools, models, companies, research, offers }
router.get('/', (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json({ news: [], tools: [], models: [], companies: [], research: [], offers: [] });
    }
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    const tokens = tokenize(q);

    const run = (table, extraWhere = '') => {
      const { sql, params } = matchAll(tokens, FIELDS[table === 'student_offers' ? 'offers' : table === 'research_papers' ? 'research' : table]);
      return { sql, params, extraWhere };
    };

    const newsW = run('news');
    const news = db.prepare(
      `SELECT * FROM news WHERE hidden = 0 AND (${newsW.sql})
       ORDER BY ${relevance(tokens, FIELDS.news)} DESC, importance DESC, published_at DESC LIMIT @limit`
    ).all({ ...newsW.params, limit });

    const toolsW = run('tools');
    const tools = db.prepare(
      `SELECT * FROM tools WHERE (${toolsW.sql})
       ORDER BY ${relevance(tokens, FIELDS.tools)} DESC, featured DESC, name ASC LIMIT @limit`
    ).all({ ...toolsW.params, limit });

    const modelsW = run('models');
    const models = db.prepare(
      `SELECT * FROM models WHERE (${modelsW.sql})
       ORDER BY ${relevance(tokens, FIELDS.models)} DESC, release_date DESC LIMIT @limit`
    ).all({ ...modelsW.params, limit });

    const companiesW = run('companies');
    const companies = db.prepare(
      `SELECT * FROM companies WHERE (${companiesW.sql})
       ORDER BY ${relevance(tokens, FIELDS.companies)} DESC, name ASC LIMIT @limit`
    ).all({ ...companiesW.params, limit });

    const researchW = run('research');
    const research = db.prepare(
      `SELECT * FROM research_papers WHERE (${researchW.sql})
       ORDER BY ${relevance(tokens, FIELDS.research)} DESC, published_at DESC LIMIT @limit`
    ).all({ ...researchW.params, limit });

    const offersW = run('offers');
    const offers = db.prepare(
      `SELECT * FROM student_offers WHERE (${offersW.sql})
       ORDER BY ${relevance(tokens, FIELDS.offers)} DESC, featured DESC,
         CASE status WHEN 'expired' THEN 1 ELSE 0 END ASC, updated_at DESC LIMIT @limit`
    ).all({ ...offersW.params, limit });

    res.json({ news, tools, models, companies, research, offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
