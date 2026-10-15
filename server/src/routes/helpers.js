// Shared route helpers: pagination, cluster building, JSON parsing.

export function getPagination(query, defaultPageSize = 20, maxPageSize = 100) {
  let page = parseInt(query.page, 10);
  let pageSize = parseInt(query.pageSize, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = defaultPageSize;
  if (pageSize > maxPageSize) pageSize = maxPageSize;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function listResponse(items, total, page, pageSize, extra = {}) {
  return { items, total, page, pageSize, ...extra };
}

// Build a cluster descriptor for a primary article row.
export function clusterFor(db, article) {
  if (!article || article.cluster_id == null) return null;
  const rows = db.prepare(
    'SELECT id, source_name, source_url, title, importance FROM news WHERE cluster_id = ? AND hidden = 0 ORDER BY importance DESC, published_at DESC'
  ).all(article.cluster_id);
  if (rows.length < 2) return null;
  const primary = rows[0];
  return {
    id: article.cluster_id,
    primary_source_name: primary.source_name,
    count: rows.length,
    sources: rows.map((r) => ({ source_name: r.source_name, source_url: r.source_url }))
  };
}
