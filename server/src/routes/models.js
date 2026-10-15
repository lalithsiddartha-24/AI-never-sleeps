import { Router } from 'express';
import db from '../db.js';
import { getPagination, listResponse } from './helpers.js';

const router = Router();

// GET /api/models?type=&openSource=1&q=&page=&pageSize=
router.get('/', (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req.query, 24);
    const where = ['1=1'];
    const params = {};
    if (req.query.type) { where.push('model_type = @type'); params.type = req.query.type; }
    if (req.query.openSource === '1' || req.query.openSource === 'true') where.push('open_source = 1');
    if (req.query.q) {
      where.push('(name LIKE @q OR developer LIKE @q OR description LIKE @q)');
      params.q = `%${req.query.q}%`;
    }
    const whereSql = where.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) AS c FROM models WHERE ${whereSql}`).get(params).c;
    const items = db.prepare(
      `SELECT * FROM models WHERE ${whereSql} ORDER BY release_date DESC, name ASC LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSize, offset });
    const types = db.prepare(
      'SELECT model_type AS type, COUNT(*) AS count FROM models GROUP BY model_type ORDER BY count DESC'
    ).all();
    res.json(listResponse(items, total, page, pageSize, { types }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/models/:slug → { model, news }
router.get('/:slug', (req, res) => {
  try {
    const model = db.prepare('SELECT * FROM models WHERE slug = ?').get(req.params.slug);
    if (!model) return res.status(404).json({ error: 'Model not found' });

    // News mentioning the model name or its developer
    const baseName = model.name.replace(/\s*(\[.*\]|large|mini|flash|pro)$/i, '').trim();
    const terms = [model.name, baseName, model.developer].filter(Boolean);
    const seen = new Set();
    const uniqTerms = terms.filter((t) => t.length >= 3 && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
    const clauses = uniqTerms.map((_, i) => `(title LIKE @t${i} OR summary LIKE @t${i} OR tags LIKE @t${i})`).join(' OR ');
    const newsParams = {};
    uniqTerms.forEach((t, i) => { newsParams[`t${i}`] = `%${t}%`; });
    const news = db.prepare(
      `SELECT * FROM news WHERE hidden = 0 AND (${clauses}) ORDER BY published_at DESC LIMIT 12`
    ).all(newsParams);

    res.json({ model, news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
