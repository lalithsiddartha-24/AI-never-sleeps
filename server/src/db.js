import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, 'hub.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  url TEXT,
  feed_url TEXT NOT NULL,
  feed_type TEXT NOT NULL DEFAULT 'rss',
  category TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  logo_url TEXT,
  priority INTEGER NOT NULL DEFAULT 3
);

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  founded TEXT,
  hq TEXT,
  focus_areas TEXT DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  key_takeaways TEXT DEFAULT '[]',
  why_it_matters TEXT,
  content_snippet TEXT,
  source_id INTEGER,
  source_name TEXT,
  source_slug TEXT,
  source_logo_url TEXT,
  source_url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  author TEXT,
  published_at TEXT,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  tags TEXT DEFAULT '[]',
  importance INTEGER NOT NULL DEFAULT 3,
  cluster_id INTEGER,
  processing_status TEXT NOT NULL DEFAULT 'published',
  processing_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_seed INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS news_tags (
  news_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (news_id, tag_id)
);

CREATE TABLE IF NOT EXISTS tool_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  long_description TEXT,
  website TEXT,
  logo_url TEXT,
  company_id INTEGER,
  company_name TEXT,
  category TEXT NOT NULL DEFAULT 'Productivity',
  subcategory TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'Freemium',
  open_source INTEGER NOT NULL DEFAULT 0,
  platforms TEXT DEFAULT '[]',
  capabilities TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  launch_date TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  related_tool_ids TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  developer TEXT,
  company_id INTEGER,
  model_type TEXT NOT NULL DEFAULT 'LLM',
  release_date TEXT,
  context_length INTEGER,
  modalities TEXT DEFAULT '[]',
  open_source INTEGER NOT NULL DEFAULT 0,
  api_available INTEGER NOT NULL DEFAULT 1,
  pricing_notes TEXT,
  benchmark_notes TEXT,
  official_url TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS research_papers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  arxiv_id TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  authors TEXT DEFAULT '[]',
  abstract TEXT,
  summary TEXT,
  url TEXT,
  pdf_url TEXT,
  published_at TEXT,
  primary_category TEXT,
  tags TEXT DEFAULT '[]',
  company_slug TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  company_id INTEGER,
  company_name TEXT,
  tool_id INTEGER,
  tool_name TEXT,
  logo_url TEXT,
  title TEXT NOT NULL,
  student_benefit TEXT,
  description TEXT,
  offer_type TEXT NOT NULL DEFAULT 'Student Program',
  category TEXT NOT NULL DEFAULT 'Productivity',
  student_price TEXT,
  regular_price TEXT,
  discount_percentage INTEGER,
  free_credits TEXT,
  eligibility TEXT,
  verification_method TEXT,
  geographic_restrictions TEXT,
  how_to_claim TEXT DEFAULT '[]',
  important_conditions TEXT,
  official_url TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'verification',
  is_student_only INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  tags TEXT DEFAULT '[]',
  expiration_date TEXT,
  last_verified_at TEXT,
  last_check_status TEXT,
  last_check_code INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default',
  item_type TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, item_type, item_id)
);

CREATE TABLE IF NOT EXISTS crawl_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER,
  source_name TEXT,
  status TEXT NOT NULL DEFAULT 'ok',
  items_found INTEGER NOT NULL DEFAULT 0,
  items_added INTEGER NOT NULL DEFAULT 0,
  duplicates INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_source_url ON news(source_url);
CREATE INDEX IF NOT EXISTS idx_news_cluster ON news(cluster_id);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_source ON crawl_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_name ON tools(name);
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_offers_category ON student_offers(category);
CREATE INDEX IF NOT EXISTS idx_offers_status ON student_offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_expiration ON student_offers(expiration_date);
CREATE INDEX IF NOT EXISTS idx_offers_company ON student_offers(company_id);
CREATE INDEX IF NOT EXISTS idx_offers_type ON student_offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_last_verified ON student_offers(last_verified_at);
`);

export default db;
