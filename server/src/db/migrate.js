// Idempotent, additive schema migrations for existing SQLite databases.
//
// db.js only runs CREATE TABLE IF NOT EXISTS, so columns added after a DB was
// first created are missing on upgrades. This module adds those columns with
// ALTER TABLE ... ADD COLUMN, guarded by PRAGMA table_info so re-running is a
// no-op. It never drops tables or columns and never migrates off SQLite (§35).
//
// Run automatically at boot (see index.js) or manually: node src/db/migrate.js

// Each migration: { table, column, ddl } — ddl is the column definition
// appended after "ALTER TABLE <table> ADD COLUMN ".
const MIGRATIONS = [
  { table: 'news', column: 'processing_status', ddl: "processing_status TEXT NOT NULL DEFAULT 'published'" },
  { table: 'news', column: 'processing_error', ddl: 'processing_error TEXT' },
  { table: 'crawl_logs', column: 'duplicates', ddl: 'duplicates INTEGER NOT NULL DEFAULT 0' },
];

function tableExists(db, table) {
  return Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table));
}

function columnExists(db, table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
}

export function migrate(db) {
  const applied = [];
  for (const m of MIGRATIONS) {
    if (!tableExists(db, m.table)) continue; // table not created yet; db.js handles it
    if (columnExists(db, m.table, m.column)) continue; // already migrated
    db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.ddl}`);
    applied.push(`${m.table}.${m.column}`);
  }
  // Indexes are cheap to (re)assert and are idempotent by name.
  db.exec(`CREATE INDEX IF NOT EXISTS idx_news_processing_status ON news(processing_status)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_crawl_logs_source ON crawl_logs(source_id)`);
  return applied;
}

export default migrate;

// Allow `npm run migrate` / `node src/db/migrate.js` standalone.
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('migrate.js')) {
  const { default: db } = await import('../db.js');
  const applied = migrate(db);
  console.log(applied.length ? `[migrate] applied: ${applied.join(', ')}` : '[migrate] schema up to date');
}
