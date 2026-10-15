const BASE = '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', params, body, signal } = {}) {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  let res;
  try {
    res = await fetch(url.pathname + url.search, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the API. Is the server running?', 0);
  }
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (res.ok) {
      throw new ApiError('The API returned an invalid response. Check that the backend is running.', res.status);
    }
  }
  if (!res.ok) {
    throw new ApiError((data && data.error) || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  getNews: (params, signal) => request('/news', { params, signal }),
  getBreaking: (limit = 5, signal) => request('/news/breaking', { params: { limit }, signal }),
  getTrending: (limit = 8, signal) => request('/news/trending', { params: { limit }, signal }),
  getArticle: (slug, signal) => request(`/news/${encodeURIComponent(slug)}`, { signal }),
  getLastUpdate: (since, signal) => request('/news/meta/last-update', { params: { since }, signal }),

  getTools: (params, signal) => request('/tools', { params, signal }),
  getTool: (slug, signal) => request(`/tools/${encodeURIComponent(slug)}`, { signal }),

  getModels: (params, signal) => request('/models', { params, signal }),
  getModel: (slug, signal) => request(`/models/${encodeURIComponent(slug)}`, { signal }),

  getResearch: (params, signal) => request('/research', { params, signal }),
  getPaper: (slug, signal) => request(`/research/${encodeURIComponent(slug)}`, { signal }),

  getCompanies: (q, signal) => request('/companies', { params: { q }, signal }),
  getCompany: (slug, signal) => request(`/companies/${encodeURIComponent(slug)}`, { signal }),

  getStudentOffers: (params, signal) => request('/student-offers', { params, signal }),
  getFeaturedOffers: (limit = 6, signal) => request('/student-offers/featured', { params: { limit }, signal }),
  getExpiringOffers: (days = 45, signal) => request('/student-offers/expiring', { params: { days }, signal }),
  getRecentOffers: (limit = 6, signal) => request('/student-offers/recent', { params: { limit }, signal }),
  getStudentOffer: (slug, signal) => request(`/student-offers/${encodeURIComponent(slug)}`, { signal }),

  search: (q, limit = 6, signal) => request('/search', { params: { q, limit }, signal }),

  getBookmarks: (userId = 'default', signal) => request('/bookmarks', { params: { userId }, signal }),
  addBookmark: (itemType, itemId, userId = 'default') =>
    request('/bookmarks', { method: 'POST', body: { userId, itemType, itemId } }),
  removeBookmark: (itemType, itemId, userId = 'default') =>
    request('/bookmarks', { method: 'DELETE', body: { userId, itemType, itemId } }),

  admin: {
    stats: (signal) => request('/admin/stats', { signal }),
    getSources: (signal) => request('/admin/sources', { signal }),
    addSource: (body) => request('/admin/sources', { method: 'POST', body }),
    patchSource: (id, body) => request(`/admin/sources/${id}`, { method: 'PATCH', body }),
    deleteSource: (id) => request(`/admin/sources/${id}`, { method: 'DELETE' }),
    deleteTool: (id) => request(`/admin/tools/${id}`, { method: 'DELETE' }),
    patchNews: (id, body) => request(`/admin/news/${id}`, { method: 'PATCH', body }),
    deleteNews: (id) => request(`/admin/news/${id}`, { method: 'DELETE' }),
    refresh: () => request('/admin/refresh', { method: 'POST' }),

    offerMeta: (signal) => request('/admin/offers/meta', { signal }),
    getOffers: (params, signal) => request('/admin/offers', { params, signal }),
    addOffer: (body) => request('/admin/offers', { method: 'POST', body }),
    patchOffer: (id, body) => request(`/admin/offers/${id}`, { method: 'PATCH', body }),
    deleteOffer: (id) => request(`/admin/offers/${id}`, { method: 'DELETE' }),
    verifyOffer: (id, body) => request(`/admin/offers/${id}/verify`, { method: 'POST', body }),
    expireOffer: (id) => request(`/admin/offers/${id}/expire`, { method: 'POST' }),
    verifyAllOffers: () => request('/admin/offers/verify-all', { method: 'POST' }),
  },
};

export default api;
