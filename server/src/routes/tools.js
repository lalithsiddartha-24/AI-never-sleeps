import { Router } from 'express';
import db from '../db.js';
import { getPagination, listResponse } from './helpers.js';

const router = Router();

const SORTS = {
  featured: 'featured DESC, rating_sum * 1.0 / MAX(rating_count, 1) DESC, name ASC',
  name: 'name ASC',
  updated: 'updated_at DESC, name ASC'
};

// GET /api/tools?page=&pageSize=&category=&pricing=&openSource=1&q=&sort=&platform=
router.get('/', (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req.query, 24);
    const where = ['1=1'];
    const params = {};
    if (req.query.category) { where.push('category = @category'); params.category = req.query.category; }
    if (req.query.pricing) { where.push('pricing_type = @pricing'); params.pricing = req.query.pricing; }
    if (req.query.openSource === '1' || req.query.openSource === 'true') where.push('open_source = 1');
    if (req.query.q) {
      where.push('(name LIKE @q OR description LIKE @q OR company_name LIKE @q OR tags LIKE @q)');
      params.q = `%${req.query.q}%`;
    }
    if (req.query.platform) { where.push('platforms LIKE @platform'); params.platform = `%${req.query.platform}%`; }

    const sortKey = SORTS[req.query.sort] ? req.query.sort : 'featured';
    const whereSql = where.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) AS c FROM tools WHERE ${whereSql}`).get(params).c;
    const items = db.prepare(
      `SELECT t.*, (SELECT name FROM companies c WHERE c.id = t.company_id) AS linked_company
       FROM tools t WHERE ${whereSql}
       ORDER BY ${SORTS[sortKey]}
       LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSize, offset });
    const categories = db.prepare(
      'SELECT category, COUNT(*) AS count FROM tools GROUP BY category ORDER BY count DESC, category ASC'
    ).all();
    res.json(listResponse(items, total, page, pageSize, { categories }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tools/:slug → { tool, alternatives, news }
router.get('/:slug', (req, res) => {
  try {
    const tool = db.prepare('SELECT * FROM tools WHERE slug = ?').get(req.params.slug);
    if (!tool) return res.status(404).json({ error: 'Tool not found' });

    const alternatives = db.prepare(
      'SELECT * FROM tools WHERE category = ? AND id != ? ORDER BY featured DESC, name ASC LIMIT 8'
    ).all(tool.category, tool.id);

    // News mentioning the tool or its company
    const terms = [tool.name, tool.company_name].filter(Boolean);
    let news = [];
    if (terms.length) {
      const clauses = terms.map((_, i) => `(title LIKE @t${i} OR summary LIKE @t${i})`).join(' OR ');
      const newsParams = {};
      terms.forEach((t, i) => { newsParams[`t${i}`] = `%${t}%`; });
      news = db.prepare(
        `SELECT * FROM news WHERE hidden = 0 AND (${clauses})
         ORDER BY published_at DESC LIMIT 12`
      ).all(newsParams);
    }

    res.json({ tool, alternatives, news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
