import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/companies?q=
router.get('/', (req, res) => {
  try {
    let items;
    if (req.query.q) {
      items = db.prepare(
        `SELECT * FROM companies
         WHERE name LIKE @q OR description LIKE @q OR focus_areas LIKE @q
         ORDER BY name ASC`
      ).all({ q: `%${req.query.q}%` });
    } else {
      items = db.prepare('SELECT * FROM companies ORDER BY name ASC').all();
    }
    res.json({ items, total: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/companies/:slug → { company, news, tools, models, research }
router.get('/:slug', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM companies WHERE slug = ?').get(req.params.slug);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const like = `%${company.name}%`;
    // For short/generic names also match the slug form.
    const nameTerms = [company.name];
    if (company.name === 'Meta AI') nameTerms.push('Meta');
    if (company.name === 'xAI') nameTerms.push('Grok');
    if (company.name === 'Google DeepMind') nameTerms.push('DeepMind', 'Google');

    const clauses = nameTerms.map((_, i) => `(title LIKE @n${i} OR summary LIKE @n${i})`).join(' OR ');
    const newsParams = {};
    nameTerms.forEach((t, i) => { newsParams[`n${i}`] = `%${t}%`; });

    const news = db.prepare(
      `SELECT * FROM news WHERE hidden = 0 AND (${clauses}) ORDER BY published_at DESC LIMIT 20`
    ).all(newsParams);

    const tools = db.prepare(
      `SELECT * FROM tools WHERE company_id = ? OR company_name = ? ORDER BY featured DESC, name ASC`
    ).all(company.id, company.name);

    const models = db.prepare(
      `SELECT * FROM models WHERE company_id = ? OR developer = ? ORDER BY release_date DESC`
    ).all(company.id, company.name);

    const research = db.prepare(
      `SELECT * FROM research_papers WHERE company_slug = ? ORDER BY published_at DESC LIMIT 20`
    ).all(company.slug);

    res.json({ company, news, tools, models, research });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
