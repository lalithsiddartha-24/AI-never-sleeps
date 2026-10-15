import { Router } from 'express';
import db from '../db.js';
import { getPagination, listResponse } from './helpers.js';

const router = Router();

const SORTS = {
  published_at: 'published_at DESC, id DESC',
  importance: 'importance DESC, published_at DESC, id DESC'
};

function buildFilters(query) {
  const where = ['hidden = 0'];
  const params = {};
  if (query.category) { where.push('category = @category'); params.category = query.category; }
  if (query.source) {
    where.push('(source_slug = @source OR LOWER(source_name) = LOWER(@source))');
    params.source = decodeURIComponent(query.source);
  }
  if (query.q) {
    where.push('(title LIKE @q OR summary LIKE @q)');
    params.q = `%${query.q}%`;
  }
  if (query.importance) {
    const imp = parseInt(query.importance, 10);
    if (Number.isFinite(imp)) { where.push('importance = @importance'); params.importance = imp; }
  }
  return { where: where.join(' AND '), params };
}

// GET /api/news?page=&pageSize=&category=&source=&q=&importance=&sort=&clustered=
router.get('/', (req, res) => {
  try {
    const { page, pageSize } = getPagination(req.query);
    const clustered = req.query.clustered === '1' || req.query.clustered === 'true';
    const { where, params } = buildFilters(req.query);
    const sort = SORTS[req.query.sort] ? req.query.sort : 'published_at';
    const orderBy = SORTS[sort];

    if (clustered) {
      const rows = db.prepare(`SELECT * FROM news WHERE ${where} ORDER BY ${orderBy}`).all(params);
      const groups = new Map();
      for (const row of rows) {
        const key = row.cluster_id != null ? `c${row.cluster_id}` : `n${row.id}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      }
      const items = [...groups.values()].map((members) => {
        const primary = { ...members[0] };
        primary.cluster = members.length > 1 && members[0].cluster_id != null
          ? {
              id: members[0].cluster_id,
              primary_source_name: members[0].source_name,
              count: members.length,
              sources: members.map((m) => ({ source_name: m.source_name, source_url: m.source_url }))
            }
          : null;
        return primary;
      });
      const total = items.length;
      const start = (page - 1) * pageSize;
      return res.json(listResponse(items.slice(start, start + pageSize), total, page, pageSize));
    }

    const total = db.prepare(`SELECT COUNT(*) AS c FROM news WHERE ${where}`).get(params).c;
    const items = db.prepare(
      `SELECT * FROM news WHERE ${where} ORDER BY ${orderBy} LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSize, offset: (page - 1) * pageSize })
      .map((r) => ({ ...r, cluster: null }));
    res.json(listResponse(items, total, page, pageSize));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/breaking?limit=5 — top importance from last 48h
router.get('/breaking', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 50);
    const items = db.prepare(`
      SELECT * FROM news
      WHERE hidden = 0 AND published_at >= datetime('now', '-48 hours')
      ORDER BY importance DESC, published_at DESC
      LIMIT ?
    `).all(limit);
    // If the 48h window is sparse (fresh install), fall back to most recent high-importance.
    const rows = items.length
      ? items
      : db.prepare('SELECT * FROM news WHERE hidden = 0 ORDER BY importance DESC, published_at DESC LIMIT ?').all(limit);
    res.json({ items: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/trending?limit=8 — importance + recency + cluster size proxy
router.get('/trending', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 8, 1), 50);
    const items = db.prepare(`
      SELECT n.*,
        (SELECT COUNT(*) FROM news m WHERE m.cluster_id = n.cluster_id AND n.cluster_id IS NOT NULL AND m.hidden = 0) AS cluster_count
      FROM news n
      WHERE n.hidden = 0
      ORDER BY
        (n.importance * 2 + MIN(cluster_count, 3) +
         MAX(0, 3 - CAST((julianday('now') - julianday(n.published_at)) AS INTEGER)) * 0.5) DESC,
        n.published_at DESC
      LIMIT ?
    `).all(limit);
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/meta/last-update?since=ISO → { lastUpdate, newCount }
router.get('/meta/last-update', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT
        (SELECT MAX(created_at) FROM crawl_logs WHERE status = 'ok' AND items_added > 0) AS lastIngest,
        (SELECT MAX(published_at) FROM news WHERE hidden = 0) AS lastPublished
    `).get();
    const lastUpdate = row.lastIngest || row.lastPublished || null;
    let newCount = 0;
    if (req.query.since) {
      const since = new Date(req.query.since);
      if (!Number.isNaN(since.getTime())) {
        newCount = db.prepare(
          "SELECT COUNT(*) AS c FROM news WHERE hidden = 0 AND created_at > datetime(?)"
        ).get(since.toISOString().replace('T', ' ').replace('Z', '')).c;
      }
    }
    res.json({ lastUpdate, newCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/:slug — article + cluster coverage + related (same category, 6)
router.get('/:slug', (req, res) => {
  try {
    const article = db.prepare('SELECT * FROM news WHERE slug = ? AND hidden = 0').get(req.params.slug);
    if (!article) return res.status(404).json({ error: 'Article not found' });

    let cluster = null;
    if (article.cluster_id != null) {
      const members = db.prepare(
        `SELECT id, title, slug, source_name, source_url, source_logo_url, published_at, importance
         FROM news WHERE cluster_id = ? AND hidden = 0
         ORDER BY importance DESC, published_at DESC`
      ).all(article.cluster_id);
      if (members.length >= 1) {
        cluster = {
          id: article.cluster_id,
          primary_source_name: members[0].source_name,
          count: members.length,
          sources: members.map((m) => ({ source_name: m.source_name, source_url: m.source_url })),
          coverage: members
        };
      }
    }

    const related = db.prepare(
      `SELECT * FROM news
       WHERE hidden = 0 AND category = ? AND id != ?
       ORDER BY importance DESC, published_at DESC LIMIT 6`
    ).all(article.category, article.id);

    res.json({ ...article, cluster, related });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
