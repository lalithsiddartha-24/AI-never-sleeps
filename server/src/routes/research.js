import { Router } from 'express';
import db from '../db.js';
import { getPagination, listResponse } from './helpers.js';

const router = Router();

// GET /api/research?q=&page=&pageSize=
router.get('/', (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req.query);
    const where = ['1=1'];
    const params = {};
    if (req.query.q) {
      where.push('(title LIKE @q OR abstract LIKE @q OR summary LIKE @q OR authors LIKE @q OR tags LIKE @q)');
      params.q = `%${req.query.q}%`;
    }
    const whereSql = where.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) AS c FROM research_papers WHERE ${whereSql}`).get(params).c;
    const items = db.prepare(
      `SELECT * FROM research_papers WHERE ${whereSql} ORDER BY published_at DESC LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSize, offset });
    res.json(listResponse(items, total, page, pageSize));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/research/:slug → { paper }
router.get('/:slug', (req, res) => {
  try {
    const paper = db.prepare('SELECT * FROM research_papers WHERE slug = ?').get(req.params.slug);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    res.json({ paper });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
