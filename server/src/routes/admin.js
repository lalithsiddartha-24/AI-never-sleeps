import { Router } from 'express';
import db from '../db.js';
import { slugify } from '../utils.js';
import { runIngestion, isIngestionRunning } from '../ingest/pipeline.js';
import { verifyOffers, isVerificationRunning } from '../verify/offers.js';
import { OFFER_TYPES, OFFER_CATEGORIES, OFFER_STATUSES } from './studentOffers.js';

const router = Router();

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM news WHERE hidden = 0 AND date(created_at) = date('now')) AS articlesToday,
        (SELECT COUNT(*) FROM news WHERE hidden = 0) AS articlesTotal,
        (SELECT COUNT(*) FROM news WHERE hidden = 0 AND is_seed = 0) AS articlesIngested,
        (SELECT COUNT(*) FROM tools) AS toolsIndexed,
        (SELECT COUNT(*) FROM sources WHERE active = 1) AS sourcesActive,
        (SELECT COUNT(*) FROM sources) AS sourcesTotal,
        (SELECT COUNT(*) FROM crawl_logs WHERE status = 'error' AND created_at >= datetime('now', '-24 hours')) AS failedFetches,
        (SELECT COUNT(*) FROM news WHERE cluster_id IS NOT NULL AND hidden = 0) AS duplicatesDetected,
        (SELECT MAX(created_at) FROM crawl_logs WHERE status = 'ok' AND items_added > 0) AS lastSuccessfulUpdate,
        (SELECT COUNT(*) FROM models) AS modelsIndexed,
        (SELECT COUNT(*) FROM research_papers) AS papersIndexed,
        (SELECT COUNT(*) FROM student_offers) AS offersTotal,
        (SELECT COUNT(*) FROM student_offers WHERE status IN ('active','ongoing','expiring')) AS offersActive,
        (SELECT COUNT(*) FROM student_offers WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m','now')) AS offersAddedThisMonth,
        (SELECT COUNT(*) FROM student_offers WHERE status != 'expired' AND expiration_date IS NOT NULL AND date(expiration_date) BETWEEN date('now') AND date('now','+45 days')) AS offersExpiringSoon,
        (SELECT COUNT(*) FROM student_offers WHERE status = 'verification') AS offersRequiringVerification,
        (SELECT COUNT(*) FROM student_offers WHERE status = 'expired') AS offersExpired
    `).get();
    const crawlLogs = db.prepare(
      'SELECT * FROM crawl_logs ORDER BY id DESC LIMIT 20'
    ).all();
    res.json({ ...stats, ingestionRunning: isIngestionRunning(), offersVerifying: isVerificationRunning(), crawlLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Sources ----
router.get('/sources', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM sources ORDER BY priority DESC, name ASC').all();
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sources', (req, res) => {
  try {
    const { name, url, feed_url, feed_type, category, priority, logo_url } = req.body || {};
    if (!name || !feed_url) return res.status(400).json({ error: 'name and feed_url are required' });
    try {
      const u = new URL(feed_url);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      return res.status(400).json({ error: 'feed_url must be a valid http(s) URL' });
    }
    const info = db.prepare(`INSERT INTO sources (name, slug, url, feed_url, feed_type, category, active, logo_url, priority)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .run(name, slugify(name), url || null, feed_url, feed_type || 'rss', category || 'news',
        logo_url || null, Math.min(Math.max(parseInt(priority, 10) || 3, 1), 5));
    const item = db.prepare('SELECT * FROM sources WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ item });
  } catch (err) {
    if (/UNIQUE/i.test(err.message)) return res.status(409).json({ error: 'A source with that slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/sources/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM sources WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Source not found' });
    const fields = ['active', 'priority', 'feed_url', 'name', 'category'];
    const sets = [];
    const params = { id: existing.id };
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = @${f}`); params[f] = req.body[f]; }
    }
    if (sets.length) db.prepare(`UPDATE sources SET ${sets.join(', ')} WHERE id = @id`).run(params);
    res.json({ item: db.prepare('SELECT * FROM sources WHERE id = ?').get(existing.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sources/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM sources WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Source not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Tools ----
router.post('/tools', (req, res) => {
  try {
    const b = req.body || {};
    if (!b.name) return res.status(400).json({ error: 'name is required' });
    const info = db.prepare(`INSERT INTO tools
      (name, slug, description, long_description, website, logo_url, company_id, company_name,
       category, subcategory, pricing_type, open_source, platforms, capabilities, tags, launch_date, featured)
      VALUES (@name, @slug, @description, @long_description, @website, @logo_url, @company_id, @company_name,
       @category, @subcategory, @pricing_type, @open_source, @platforms, @capabilities, @tags, @launch_date, @featured)`)
      .run({
        name: b.name,
        slug: b.slug || slugify(b.name),
        description: b.description || null,
        long_description: b.long_description || b.description || null,
        website: b.website || null,
        logo_url: b.logo_url || null,
        company_id: b.company_id ?? null,
        company_name: b.company_name || null,
        category: b.category || 'Productivity',
        subcategory: b.subcategory || null,
        pricing_type: b.pricing_type || 'Freemium',
        open_source: b.open_source ? 1 : 0,
        platforms: JSON.stringify(b.platforms || []),
        capabilities: JSON.stringify(b.capabilities || []),
        tags: JSON.stringify(b.tags || []),
        launch_date: b.launch_date || null,
        featured: b.featured ? 1 : 0
      });
    res.status(201).json({ item: db.prepare('SELECT * FROM tools WHERE id = ?').get(info.lastInsertRowid) });
  } catch (err) {
    if (/UNIQUE/i.test(err.message)) return res.status(409).json({ error: 'A tool with that slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/tools/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM tools WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Tool not found' });
    const jsonFields = ['platforms', 'capabilities', 'tags', 'related_tool_ids'];
    const plainFields = ['name', 'description', 'long_description', 'website', 'logo_url', 'company_name',
      'category', 'subcategory', 'pricing_type', 'open_source', 'launch_date', 'featured'];
    const sets = [];
    const params = { id: existing.id };
    for (const f of plainFields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = @${f}`); params[f] = req.body[f]; }
    }
    for (const f of jsonFields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = @${f}`); params[f] = JSON.stringify(req.body[f]); }
    }
    if (sets.length) {
      db.prepare(`UPDATE tools SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(params);
    }
    res.json({ item: db.prepare('SELECT * FROM tools WHERE id = ?').get(existing.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tools/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Tool not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Student offers (§47) ----
const OFFER_JSON_FIELDS = ['how_to_claim', 'tags'];
const OFFER_PLAIN_FIELDS = [
  'title', 'slug', 'company_id', 'company_name', 'tool_id', 'tool_name', 'logo_url',
  'student_benefit', 'description', 'offer_type', 'category', 'student_price', 'regular_price',
  'free_credits', 'eligibility', 'verification_method', 'geographic_restrictions',
  'important_conditions', 'official_url', 'source_url', 'status', 'is_student_only',
  'featured', 'expiration_date'
];

router.get('/offers/meta', (req, res) => {
  res.json({ types: OFFER_TYPES, categories: OFFER_CATEGORIES, statuses: OFFER_STATUSES });
});

router.get('/offers', (req, res) => {
  try {
    const items = db.prepare(
      `SELECT * FROM student_offers
       ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'ongoing' THEN 1 WHEN 'expiring' THEN 2
         WHEN 'verification' THEN 3 WHEN 'expired' THEN 4 ELSE 5 END, created_at DESC`
    ).all();
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/offers', (req, res) => {
  try {
    const b = req.body || {};
    if (!b.title) return res.status(400).json({ error: 'title is required' });
    if (!b.official_url) return res.status(400).json({ error: 'official_url is required' });
    try {
      const u = new URL(b.official_url);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      return res.status(400).json({ error: 'official_url must be a valid http(s) URL' });
    }
    const status = OFFER_STATUSES.includes(b.status) ? b.status : 'verification';
    const discount = b.discount_percentage == null || b.discount_percentage === ''
      ? null : Math.min(100, Math.max(0, parseInt(b.discount_percentage, 10) || 0));
    const info = db.prepare(`INSERT INTO student_offers
      (slug, company_id, company_name, tool_id, tool_name, logo_url, title, student_benefit, description,
       offer_type, category, student_price, regular_price, discount_percentage, free_credits, eligibility,
       verification_method, geographic_restrictions, how_to_claim, important_conditions, official_url,
       source_url, status, is_student_only, featured, tags, expiration_date)
      VALUES (@slug, @company_id, @company_name, @tool_id, @tool_name, @logo_url, @title, @student_benefit, @description,
       @offer_type, @category, @student_price, @regular_price, @discount_percentage, @free_credits, @eligibility,
       @verification_method, @geographic_restrictions, @how_to_claim, @important_conditions, @official_url,
       @source_url, @status, @is_student_only, @featured, @tags, @expiration_date)`)
      .run({
        slug: b.slug || slugify(b.title),
        company_id: b.company_id ?? null,
        company_name: b.company_name || null,
        tool_id: b.tool_id ?? null,
        tool_name: b.tool_name || null,
        logo_url: b.logo_url || null,
        title: b.title,
        student_benefit: b.student_benefit || null,
        description: b.description || null,
        offer_type: OFFER_TYPES.includes(b.offer_type) ? b.offer_type : 'Student Program',
        category: OFFER_CATEGORIES.includes(b.category) ? b.category : 'Productivity',
        student_price: b.student_price || null,
        regular_price: b.regular_price || null,
        discount_percentage: discount,
        free_credits: b.free_credits || null,
        eligibility: b.eligibility || null,
        verification_method: b.verification_method || null,
        geographic_restrictions: b.geographic_restrictions || null,
        how_to_claim: JSON.stringify(b.how_to_claim || []),
        important_conditions: b.important_conditions || null,
        official_url: b.official_url,
        source_url: b.source_url || b.official_url,
        status,
        is_student_only: b.is_student_only === 0 || b.is_student_only === false ? 0 : 1,
        featured: b.featured ? 1 : 0,
        tags: JSON.stringify(b.tags || []),
        expiration_date: b.expiration_date || null
      });
    res.status(201).json({ item: db.prepare('SELECT * FROM student_offers WHERE id = ?').get(info.lastInsertRowid) });
  } catch (err) {
    if (/UNIQUE/i.test(err.message)) return res.status(409).json({ error: 'An offer with that slug already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/offers/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM student_offers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Offer not found' });
    const sets = [];
    const params = { id: existing.id };
    for (const f of OFFER_PLAIN_FIELDS) {
      if (req.body[f] !== undefined) { sets.push(`${f} = @${f}`); params[f] = req.body[f]; }
    }
    if (req.body.discount_percentage !== undefined) {
      sets.push('discount_percentage = @discount_percentage');
      params.discount_percentage = req.body.discount_percentage == null || req.body.discount_percentage === ''
        ? null : Math.min(100, Math.max(0, parseInt(req.body.discount_percentage, 10) || 0));
    }
    for (const f of OFFER_JSON_FIELDS) {
      if (req.body[f] !== undefined) { sets.push(`${f} = @${f}`); params[f] = JSON.stringify(req.body[f]); }
    }
    if (params.status !== undefined && !OFFER_STATUSES.includes(params.status)) {
      return res.status(400).json({ error: `status must be one of: ${OFFER_STATUSES.join(', ')}` });
    }
    if (sets.length) {
      db.prepare(`UPDATE student_offers SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(params);
    }
    res.json({ item: db.prepare('SELECT * FROM student_offers WHERE id = ?').get(existing.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/offers/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM student_offers WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Offer not found' });
    db.prepare("DELETE FROM bookmarks WHERE item_type IN ('offer','offers') AND item_id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually mark an offer verified (admin confirms the official offer is live).
router.post('/offers/:id/verify', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM student_offers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Offer not found' });
    const status = OFFER_STATUSES.includes(req.body && req.body.status) ? req.body.status : 'active';
    db.prepare(`UPDATE student_offers
      SET status = @status, last_verified_at = datetime('now'), last_check_status = 'manual',
          updated_at = datetime('now')
      WHERE id = @id`).run({ id: existing.id, status });
    res.json({ item: db.prepare('SELECT * FROM student_offers WHERE id = ?').get(existing.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/offers/:id/expire', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM student_offers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Offer not found' });
    db.prepare(`UPDATE student_offers SET status = 'expired', updated_at = datetime('now') WHERE id = ?`).run(existing.id);
    res.json({ item: db.prepare('SELECT * FROM student_offers WHERE id = ?').get(existing.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger the automated reachability check across all offers.
router.post('/offers/verify-all', async (req, res) => {
  try {
    if (isVerificationRunning()) return res.json({ ok: true, alreadyRunning: true });
    const result = await Promise.race([
      verifyOffers({ onlyDue: true }),
      new Promise((resolve) => setTimeout(() => resolve(null), 25000))
    ]);
    if (result === null) return res.json({ ok: true, started: true });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- News moderation ----
router.patch('/news/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Article not found' });
    const sets = [];
    const params = { id: existing.id };
    for (const f of ['importance', 'category', 'hidden']) {
      if (req.body[f] !== undefined) { sets.push(`${f} = @${f}`); params[f] = req.body[f]; }
    }
    if (sets.length) {
      db.prepare(`UPDATE news SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(params);
    }
    res.json({ item: db.prepare('SELECT * FROM news WHERE id = ?').get(existing.id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/news/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM news WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Article not found' });
    db.prepare('DELETE FROM news_tags WHERE news_id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Manual refresh ----
router.post('/refresh', async (req, res) => {
  try {
    if (isIngestionRunning()) return res.json({ ok: true, alreadyRunning: true });
    const result = await Promise.race([
      runIngestion({ delayMs: 400 }),
      new Promise((resolve) => setTimeout(() => resolve(null), 25000))
    ]);
    if (result === null) return res.json({ ok: true, started: true });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
