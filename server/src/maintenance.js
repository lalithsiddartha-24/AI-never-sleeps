// One-time cleanup for data ingested before the entity-decoding and arXiv-author
// fixes. Idempotent and non-destructive: decodes HTML entities in stored text and
// backfills missing research-paper authors from a fresh arXiv fetch.
//
// Run: node src/maintenance.js

import db from './db.js';
import { decodeEntities } from './utils.js';
import { fetchSource } from './ingest/fetchers.js';

function decodeJsonArray(raw) {
  if (!raw) return raw;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return raw;
    const changed = arr.map((v) => (typeof v === 'string' ? decodeEntities(v) : v));
    return JSON.stringify(changed);
  } catch {
    return raw;
  }
}

function cleanTextTable(table, textCols, jsonCols) {
  const rows = db.prepare(`SELECT id, ${[...textCols, ...jsonCols].join(', ')} FROM ${table}`).all();
  const setClause = [...textCols.map((c) => `${c} = @${c}`), ...jsonCols.map((c) => `${c} = @${c}`)].join(', ');
  const update = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = @id`);
  let touched = 0;
  const tx = db.transaction(() => {
    for (const row of rows) {
      const patch = { id: row.id };
      let dirty = false;
      for (const c of textCols) {
        const before = row[c];
        const after = typeof before === 'string' ? decodeEntities(before) : before;
        patch[c] = after;
        if (after !== before) dirty = true;
      }
      for (const c of jsonCols) {
        const before = row[c];
        const after = typeof before === 'string' ? decodeJsonArray(before) : before;
        patch[c] = after;
        if (after !== before) dirty = true;
      }
      if (dirty) { update.run(patch); touched++; }
    }
  });
  tx();
  console.log(`[maintenance] ${table}: decoded entities in ${touched}/${rows.length} rows`);
}

async function backfillArxivAuthors() {
  const source = db.prepare("SELECT * FROM sources WHERE feed_type = 'arxiv' AND active = 1 LIMIT 1").get();
  if (!source) { console.log('[maintenance] no active arXiv source; skipping author backfill'); return; }
  const need = db.prepare(
    "SELECT id, arxiv_id FROM research_papers WHERE arxiv_id IS NOT NULL AND arxiv_id != '' AND (authors IS NULL OR authors = '[]' OR authors = '')"
  ).all();
  if (!need.length) { console.log('[maintenance] all papers already have authors'); return; }

  let items;
  try {
    items = await fetchSource(source);
  } catch (err) {
    console.warn('[maintenance] arXiv fetch failed (authors left as-is):', err.message);
    return;
  }
  const byId = new Map();
  for (const it of items) {
    const id = it.extra && it.extra.arxiv_id;
    const authors = it.extra && it.extra.authors;
    if (id && Array.isArray(authors) && authors.length) byId.set(id, authors);
  }
  const update = db.prepare('UPDATE research_papers SET authors = ? WHERE id = ?');
  let filled = 0;
  const tx = db.transaction(() => {
    for (const row of need) {
      const authors = byId.get(row.arxiv_id);
      if (authors && authors.length) { update.run(JSON.stringify(authors), row.id); filled++; }
    }
  });
  tx();
  console.log(`[maintenance] research_papers: backfilled authors for ${filled}/${need.length} papers (feed returned ${byId.size} with authors)`);
}

async function main() {
  cleanTextTable('news',
    ['title', 'summary', 'why_it_matters', 'content_snippet', 'author'],
    ['key_takeaways', 'tags']);
  cleanTextTable('research_papers',
    ['title', 'abstract', 'summary'],
    ['tags', 'authors']);
  await backfillArxivAuthors();
  console.log('[maintenance] done');
}

main().catch((err) => { console.error('[maintenance] fatal:', err); process.exit(1); });
