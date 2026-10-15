// Offer verification job (spec §49).
// Periodically reaches each offer's official_url and records the result so the UI can
// show an honest "Last verified" date and availability signal.
//
// HONESTY RULES:
//  - We NEVER promote an offer to 'active' based on cached data. The job only ever
//    DOWNGRADES: unreachable (404/410/5xx) → 'verification' (Verification Required),
//    and a past expiration_date → 'expired'.
//  - A bot-blocked page (403/429) is recorded as 'blocked' WITHOUT changing status —
//    the page exists, we just can't auto-confirm its contents. We do not spoof a
//    browser user-agent to get around access controls.
//  - `last_verified_at` is only set when we actually reached the page (2xx/3xx).

import db from '../db.js';

const UA = 'Mozilla/5.0 (compatible; AI-Intelligence-Hub/1.0; +https://github.com/local)';
const REQUEST_TIMEOUT_MS = 12000;
const CONCURRENCY = 5;
const POLITE_DELAY_MS = 250;

let verifying = false;

export function isVerificationRunning() {
  return verifying;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Classify an HTTP status / error into a check result.
function classify(status) {
  if (status >= 200 && status < 400) return 'ok';
  if (status === 403 || status === 429 || status === 401) return 'blocked';
  if (status === 404 || status === 410 || status >= 500) return 'unreachable';
  return 'error'; // 400, 405, 4xx oddities — inconclusive
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,*/*' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    // We only need the status; free the body without downloading it fully.
    try { await res.body?.cancel(); } catch { /* ignore */ }
    return { code: res.status, status: classify(res.status) };
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    // Timeouts / DNS / connection resets are inconclusive, not "page gone".
    return { code: null, status: /timeout|abort/i.test(msg) ? 'error' : 'unreachable', error: msg.slice(0, 200) };
  }
}

// Run a small concurrency pool over the offers.
async function runPool(items, worker, concurrency) {
  let idx = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const cur = items[idx++];
      await worker(cur);
      if (POLITE_DELAY_MS) await sleep(POLITE_DELAY_MS);
    }
  });
  await Promise.all(runners);
}

const stmt = {
  updateCheck: null,
  expire: null,
  load: null
};

function prepare() {
  if (stmt.load) return;
  stmt.load = db.prepare(`SELECT id, official_url, expiration_date, status FROM student_offers ORDER BY id ASC`);
  stmt.updateCheck = db.prepare(`UPDATE student_offers
    SET last_check_status = @last_check_status,
        last_check_code = @last_check_code,
        last_verified_at = COALESCE(@last_verified_at, last_verified_at),
        status = @status,
        updated_at = datetime('now')
    WHERE id = @id`);
  stmt.expire = db.prepare(`UPDATE student_offers
    SET status = 'expired', last_check_status = COALESCE(last_check_status, 'expired'),
        updated_at = datetime('now')
    WHERE id = ?`);
}

export async function verifyOffers({ onlyDue = false } = {}) {
  if (verifying) {
    console.log('[verify] offer verification already running; skipping');
    return { ok: false, alreadyRunning: true };
  }
  verifying = true;
  prepare();
  const started = Date.now();
  const totals = { checked: 0, ok: 0, blocked: 0, unreachable: 0, error: 0, expired: 0, downgraded: 0 };

  let rows = [];
  try {
    rows = stmt.load.all();
  } catch (err) {
    console.error('[verify] failed to load offers:', err.message);
    verifying = false;
    return { ok: false, error: err.message };
  }

  // Skip offers already expired unless explicitly re-checking everything.
  if (onlyDue) rows = rows.filter((r) => r.status !== 'expired');

  console.log(`[verify] checking ${rows.length} student offer URL(s)`);

  const nowIso = new Date().toISOString();

  await runPool(rows, async (row) => {
    // 1) Date-based expiry is authoritative regardless of reachability (§41: don't rely
    //    solely on the date, but a passed date is a hard signal).
    if (row.expiration_date) {
      const exp = new Date(row.expiration_date).getTime();
      if (Number.isFinite(exp) && exp < Date.now()) {
        stmt.expire.run(row.id);
        totals.expired++;
        totals.checked++;
        return;
      }
    }

    // 2) Reachability check against the official page.
    const result = await checkUrl(row.official_url);
    totals.checked++;
    totals[result.status] = (totals[result.status] || 0) + 1;

    let nextStatus = row.status;
    let nextVerified = null;
    if (result.status === 'ok') {
      nextVerified = nowIso; // we genuinely reached the official page
    } else if (result.status === 'unreachable') {
      // §49: page no longer available → Verification Required.
      if (row.status !== 'verification') { nextStatus = 'verification'; totals.downgraded++; }
    }
    // 'blocked' and 'error': leave status untouched (inconclusive, not gone).

    stmt.updateCheck.run({
      id: row.id,
      last_check_status: result.status,
      last_check_code: result.code,
      last_verified_at: nextVerified,
      status: nextStatus
    });
  }, CONCURRENCY);

  console.log(`[verify] done in ${Date.now() - started}ms — checked=${totals.checked} ok=${totals.ok} blocked=${totals.blocked} unreachable=${totals.unreachable} error=${totals.error} expired=${totals.expired} downgraded=${totals.downgraded}`);
  verifying = false;
  return { ok: true, ...totals, durationMs: Date.now() - started };
}
