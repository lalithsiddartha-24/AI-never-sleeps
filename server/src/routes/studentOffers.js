import { Router } from 'express';
import db from '../db.js';
import { getPagination, listResponse } from './helpers.js';

const router = Router();

// Canonical taxonomies (spec §39 offer types, §40 categories, §41 statuses).
export const OFFER_TYPES = [
  'Free for Students', 'Student Discount', 'Free Credits', 'Education Plan',
  'Developer Credits', 'Research Access', 'Student Program', 'Free Tier'
];

export const OFFER_CATEGORIES = [
  'Coding', 'Research', 'AI Models', 'Design', 'Image', 'Video',
  'Cloud & Infrastructure', 'Productivity', 'Education'
];

export const OFFER_STATUSES = ['active', 'expiring', 'ongoing', 'verification', 'expired'];

// Order statuses so live/confirmed offers surface before unverified or expired ones.
const STATUS_RANK = `CASE status
  WHEN 'active' THEN 0 WHEN 'ongoing' THEN 1 WHEN 'expiring' THEN 2
  WHEN 'verification' THEN 3 WHEN 'expired' THEN 4 ELSE 5 END`;

const SORTS = {
  featured: `featured DESC, ${STATUS_RANK}, updated_at DESC`,
  recent: `created_at DESC, ${STATUS_RANK}`,
  verified: `last_verified_at IS NULL, last_verified_at DESC, ${STATUS_RANK}`,
  expiring: `expiration_date IS NULL, expiration_date ASC, ${STATUS_RANK}`
};

function likeList(q) {
  return `%${q}%`;
}

// GET /api/student-offers?page=&pageSize=&category=&type=&status=&q=&sort=&studentOnly=1&featured=1
router.get('/', (req, res) => {
  try {
    const { page, pageSize, offset } = getPagination(req.query, 24);
    const where = ['1=1'];
    const params = {};

    if (req.query.category) { where.push('category = @category'); params.category = req.query.category; }
    if (req.query.type) { where.push('offer_type = @type'); params.type = req.query.type; }
    if (req.query.status) {
      const list = String(req.query.status).split(',').map((s) => s.trim()).filter(Boolean);
      if (list.length) {
        const placeholders = list.map((s, i) => { params[`st${i}`] = s; return `@st${i}`; });
        where.push(`status IN (${placeholders.join(', ')})`);
      }
    }
    if (req.query.studentOnly === '1' || req.query.studentOnly === 'true') where.push('is_student_only = 1');
    if (req.query.featured === '1' || req.query.featured === 'true') where.push('featured = 1');
    if (req.query.q) {
      where.push('(title LIKE @q OR student_benefit LIKE @q OR description LIKE @q OR company_name LIKE @q OR tool_name LIKE @q OR eligibility LIKE @q OR tags LIKE @q OR category LIKE @q)');
      params.q = likeList(req.query.q);
    }

    const sortKey = SORTS[req.query.sort] ? req.query.sort : 'featured';
    const whereSql = where.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) AS c FROM student_offers WHERE ${whereSql}`).get(params).c;
    const items = db.prepare(
      `SELECT * FROM student_offers WHERE ${whereSql}
       ORDER BY ${SORTS[sortKey]}
       LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSize, offset });

    const categories = db.prepare(
      'SELECT category, COUNT(*) AS count FROM student_offers GROUP BY category ORDER BY count DESC, category ASC'
    ).all();
    const types = db.prepare(
      'SELECT offer_type AS type, COUNT(*) AS count FROM student_offers GROUP BY offer_type ORDER BY count DESC, offer_type ASC'
    ).all();
    const statuses = db.prepare(
      'SELECT status, COUNT(*) AS count FROM student_offers GROUP BY status ORDER BY count DESC'
    ).all();

    res.json(listResponse(items, total, page, pageSize, { categories, types, statuses }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student-offers/featured?limit=6 → homepage STUDENT PICKS.
// Only surfaces offers that are not expired; verified/featured first.
router.get('/featured', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 24);
    const items = db.prepare(
      `SELECT * FROM student_offers
       WHERE status != 'expired'
       ORDER BY featured DESC, ${STATUS_RANK}, last_verified_at IS NULL, last_verified_at DESC
       LIMIT ?`
    ).all(limit);
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student-offers/expiring?days=45 → offers with a real expiration_date inside the window.
router.get('/expiring', (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 45, 1), 365);
    const items = db.prepare(
      `SELECT * FROM student_offers
       WHERE expiration_date IS NOT NULL AND status != 'expired'
         AND date(expiration_date) <= date('now', '+' || ? || ' days')
       ORDER BY expiration_date ASC LIMIT 50`
    ).all(days);
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student-offers/recent?limit=6 → recently added offers (dashboard).
router.get('/recent', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 24);
    const items = db.prepare(
      `SELECT * FROM student_offers ORDER BY created_at DESC, id DESC LIMIT ?`
    ).all(limit);
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/student-offers/:slug → { offer, related }
router.get('/:slug', (req, res) => {
  try {
    const offer = db.prepare('SELECT * FROM student_offers WHERE slug = ?').get(req.params.slug);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    const related = db.prepare(
      `SELECT * FROM student_offers WHERE category = ? AND id != ? AND status != 'expired'
       ORDER BY featured DESC, ${STATUS_RANK} LIMIT 6`
    ).all(offer.category, offer.id);
    res.json({ offer, related });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
