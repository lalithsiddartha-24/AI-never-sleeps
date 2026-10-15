# AI Intelligence Hub — API Contract & Architecture

Monorepo:
- `server/` — Node.js + Express + better-sqlite3 (SQLite file at `server/data/hub.db`). Schema is written to be 1:1 portable to PostgreSQL.
- `client/` — React 18 + Vite + Tailwind CSS + framer-motion + lucide-react + react-router-dom. Dev server proxies `/api` → `http://localhost:4000`.

Server port: **4000**. Client dev port: **5173**.

All responses are JSON. List endpoints return `{ items: [...], total: number, page: number, pageSize: number }` unless noted. Errors: `{ error: string }` with proper HTTP status.

## Entities (canonical shapes)

### Source
`{ id, name, slug, url, feed_url, feed_type ('rss'|'atom'|'arxiv'|'github'), category, active (0|1), logo_url, priority (int) }`

### NewsArticle
`{ id, title, slug, summary, key_takeaways (JSON string: array of strings), why_it_matters, content_snippet, source_id, source_name, source_slug, source_logo_url, source_url, image_url, author, published_at (ISO), category, tags (JSON string: array), importance (int 1-5), cluster_id, created_at, updated_at, is_seed (0|1) }`

Categories (exact strings): `AI Models`, `AI Research`, `AI Agents`, `AI Coding`, `Generative AI`, `Robotics`, `Computer Vision`, `AI Hardware`, `Open Source`, `AI Startups`, `AI Business`, `AI Safety`, `AI Regulation`, `Uncategorized`

### Cluster (duplicate-grouped story)
News list items may include `cluster: { id, primary_source_name, count, sources: [{ source_name, source_url }] } | null`.

### Company
`{ id, name, slug, description, website, logo_url, founded, hq, focus_areas (JSON string: array), created_at }`

### Tool
`{ id, name, slug, description, long_description, website, logo_url, company_id, company_name, category, subcategory, pricing_type ('Free'|'Freemium'|'Paid'|'Open Source'), open_source (0|1), platforms (JSON string: array), capabilities (JSON string: array), tags (JSON string: array), launch_date, updated_at, rating_sum, rating_count, featured (0|1), related_tool_ids (JSON string: array of ids) }`

Tool categories (exact strings): `Research`, `Coding`, `AI Agents`, `Image Generation`, `Video Generation`, `Audio`, `Writing`, `Productivity`, `Design`, `Marketing`, `Education`, `Business`, `3D & Spatial`, `Developer Infrastructure`

### Model
`{ id, name, slug, developer, company_id, model_type ('LLM'|'Vision'|'Multimodal'|'Image'|'Video'|'Audio'|'Embedding'|'Speech'|'Robotics'), release_date, context_length (int|null), modalities (JSON string: array), open_source (0|1), api_available (0|1), pricing_notes, benchmark_notes, official_url, description, created_at }`

### ResearchPaper
`{ id, arxiv_id, title, slug, authors (JSON string: array), abstract, summary, url, pdf_url, published_at, primary_category, tags (JSON string: array), company_slug (nullable), created_at }`

### Bookmark
`{ id, user_id, item_type ('news'|'tool'|'model'|'research'), item_id, created_at }`

## REST API

### News
- `GET /api/news?page=1&pageSize=20&category=&source=&q=&importance=&sort=published_at|importance&clustered=1`
  → `{ items: NewsArticle[], total, page, pageSize }`. When `clustered=1`, near-duplicates grouped; only primary item per cluster returned, with `cluster` field populated.
- `GET /api/news/breaking?limit=5` → top importance articles from last 48h.
- `GET /api/news/trending?limit=8` → highest importance + most clustered/recent engagement proxy (importance desc, recency).
- `GET /api/news/:slug` → single article with `cluster` (all coverage) + `related: NewsArticle[]` (same category, 6).
- `GET /api/news/meta/last-update` → `{ lastUpdate: ISO|null, newSince: ISO-param → count }` — actual: `GET /api/news/meta/last-update?since=ISO` → `{ lastUpdate, newCount }`.

### Tools
- `GET /api/tools?page=&pageSize=&category=&pricing=&openSource=1&q=&sort=featured|name|updated&platform=`
  → `{ items: Tool[], total, page, pageSize, categories: [{ category, count }] }`
- `GET /api/tools/:slug` → `{ tool: Tool, alternatives: Tool[], news: NewsArticle[] }` (news matched by company/tool name).

### Models
- `GET /api/models?type=&openSource=1&q=&page=&pageSize=` → `{ items: Model[], total, page, pageSize }`
- `GET /api/models/:slug` → `{ model: Model, news: NewsArticle[] }`

### Research
- `GET /api/research?q=&page=&pageSize=` → `{ items: ResearchPaper[], total, page, pageSize }`
- `GET /api/research/:slug` → `{ paper: ResearchPaper }`

### Companies
- `GET /api/companies?q=` → `{ items: Company[] }`
- `GET /api/companies/:slug` → `{ company, news: NewsArticle[], tools: Tool[], models: Model[], research: ResearchPaper[] }`

### Search (global)
- `GET /api/search?q=...&limit=6` → `{ news: [], tools: [], models: [], companies: [], research: [] }` (each capped at limit)

### Bookmarks
- `GET /api/bookmarks?userId=default` → `{ news: [], tools: [], models: [], research: [] }`
- `POST /api/bookmarks` body `{ userId, itemType, itemId }` → `{ ok: true }`
- `DELETE /api/bookmarks` body `{ userId, itemType, itemId }` → `{ ok: true }`

### Admin
- `GET /api/admin/stats` → `{ articlesToday, articlesTotal, toolsIndexed, sourcesActive, sourcesTotal, failedFetches, duplicatesDetected, lastSuccessfulUpdate, crawlLogs: [last 20 CrawlLog] }`
- `GET /api/admin/sources` → `{ items: Source[] }`
- `POST /api/admin/sources` body `{ name, url, feed_url, feed_type, category, priority }` → `{ item: Source }`
- `PATCH /api/admin/sources/:id` body `{ active?, priority? }`
- `DELETE /api/admin/sources/:id`
- `POST /api/admin/tools` body: partial Tool → `{ item }`
- `PATCH /api/admin/tools/:id` → `{ item }`
- `DELETE /api/admin/tools/:id`
- `PATCH /api/admin/news/:id` body `{ importance?, category?, hidden? }`
- `DELETE /api/admin/news/:id`
- `POST /api/admin/refresh` → triggers ingestion run immediately, returns `{ ok, added, skipped, failed }` (runs sync-ish, responds when done or times out to background with `{ ok:true, started:true }`).

### CrawlLog
`{ id, source_id, source_name, status ('ok'|'error'|'empty'), items_found, items_added, error, duration_ms, created_at }`

## Ingestion pipeline (server side)
1. Scheduler (`node-cron`, every 15 min + on boot) iterates active sources.
2. Fetchers: RSS/Atom via `rss-parser`; arXiv via its Atom API (`export.arxiv.org/api/query`); GitHub via REST (`api.github.com/search/repositories?q=topic:ai+topic:llm&sort=updated`) for open-source releases.
3. Normalize → dedupe by exact `source_url` then by title similarity (normalized token Jaccard ≥ 0.75) → if duplicate, attach to existing cluster (same `cluster_id`).
4. Classify category via keyword rules; summarize via extractive summarizer (first salient sentences, grounded, no hallucination); if `OPENAI_API_KEY` set, use LLM for summary/takeaways/tags/category instead.
5. Insert article, write CrawlLog, handle errors per-source without crashing run; respect rate limits (sequential fetch, delay between sources).
6. Seed data inserted on first boot (realistic, marked `is_seed=1`).
