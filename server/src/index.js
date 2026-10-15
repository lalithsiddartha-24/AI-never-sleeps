import './env.js';
import express from 'express';
import cors from 'cors';
import { config } from './env.js';
import db from './db.js';
import { migrate } from './db/migrate.js';
import { seedIfEmpty, ensureSources } from './seed.js';
import { startScheduler } from './scheduler.js';
import newsRoutes from './routes/news.js';
import toolsRoutes from './routes/tools.js';
import modelsRoutes from './routes/models.js';
import researchRoutes from './routes/research.js';
import companiesRoutes from './routes/companies.js';
import searchRoutes from './routes/search.js';
import bookmarksRoutes from './routes/bookmarks.js';
import studentOffersRoutes from './routes/studentOffers.js';
import adminRoutes from './routes/admin.js';

// Apply additive schema migrations first (safe on both fresh and existing DBs),
// then seed empty tables and upsert any newly-added sources into an existing DB.
migrate(db);
const seeded = seedIfEmpty(db);
if (Object.keys(seeded).length) console.log('[boot] seeded:', seeded);
const addedSources = ensureSources(db);
if (addedSources) console.log(`[boot] added ${addedSources} new source(s)`);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({
  ok: true,
  uptime: process.uptime(),
  keys: {
    gnews: Boolean(config.gnewsApiKey),
    newsapi: Boolean(config.newsApiKey),
    ai: Boolean(config.aiApiKey),
  },
}));

app.use('/api/news', newsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/student-offers', studentOffersRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[server] AI Intelligence Hub API listening on http://localhost:${PORT}`);
  console.log(`[server] optional keys — GNews:${config.gnewsApiKey ? 'on' : 'off'} NewsAPI:${config.newsApiKey ? 'on' : 'off'} AI:${config.aiApiKey ? 'on' : 'off'}`);
  startScheduler();
});
