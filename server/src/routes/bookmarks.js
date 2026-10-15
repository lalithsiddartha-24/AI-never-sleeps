import { Router } from 'express';
import db from '../db.js';

const router = Router();

const TYPE_CANON = { news: 'news', tool: 'tools', tools: 'tools', model: 'models', models: 'models', research: 'research', offer: 'offers', offers: 'offers' };

// GET /api/bookmarks?userId=default → { news, tools, models, research, offers }
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || 'default';
    const rows = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    const grouped = { news: [], tools: [], models: [], research: [], offers: [] };
    const idsByType = { news: [], tools: [], models: [], research: [], offers: [] };
    for (const b of rows) {
      const canon = TYPE_CANON[b.item_type];
      if (canon) idsByType[canon].push(b.item_id);
    }
    const queries = {
      news: 'SELECT * FROM news WHERE hidden = 0',
      tools: 'SELECT * FROM tools',
      models: 'SELECT * FROM models',
      research: 'SELECT * FROM research_papers',
      offers: 'SELECT * FROM student_offers'
    };
    for (const type of Object.keys(idsByType)) {
      const ids = [...new Set(idsByType[type])];
      if (!ids.length) continue;
      // Preserve bookmark order
      const placeholders = ids.map(() => '?').join(',');
      const found = db.prepare(`${queries[type]} AND id IN (${placeholders})`.replace(' AND id IN', type === 'news' ? ' AND id IN' : ' WHERE id IN')).all(ids);
      const byId = new Map(found.map((f) => [f.id, f]));
      grouped[type] = ids.map((id) => byId.get(id)).filter(Boolean);
    }
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookmarks { userId, itemType, itemId } → { ok: true }
router.post('/', (req, res) => {
  try {
    const { userId = 'default', itemType, itemId } = req.body || {};
    if (!itemType || !TYPE_CANON[itemType] || itemId == null) {
      return res.status(400).json({ error: 'itemType (news|tool|model|research|offer) and itemId are required' });
    }
    const id = parseInt(itemId, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'itemId must be a number' });
    db.prepare(
      'INSERT OR IGNORE INTO bookmarks (user_id, item_type, item_id) VALUES (?, ?, ?)'
    ).run(userId, itemType, id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bookmarks { userId, itemType, itemId } → { ok: true }
router.delete('/', (req, res) => {
  try {
    const { userId = 'default', itemType, itemId } = req.body || {};
    if (!itemType || itemId == null) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }
    const id = parseInt(itemId, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'itemId must be a number' });
    db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?').run(userId, itemType, id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
