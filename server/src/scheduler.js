// Scheduler: run ingestion ~10s after boot (non-blocking) and every 15 minutes.
// Overlapping runs are guarded inside runIngestion() and here.
// Also verifies student-offer official URLs ~25s after boot and daily at 04:00.

import cron from 'node-cron';
import { runIngestion, isIngestionRunning } from './ingest/pipeline.js';
import { verifyOffers, isVerificationRunning } from './verify/offers.js';

export function startScheduler() {
  const kick = () => {
    if (isIngestionRunning()) return;
    runIngestion().catch((err) => console.error('[scheduler] ingestion error:', err.message));
  };

  const verifyKick = () => {
    if (isVerificationRunning()) return;
    verifyOffers({ onlyDue: true }).catch((err) => console.error('[scheduler] offer verification error:', err.message));
  };

  setTimeout(kick, 10_000);
  cron.schedule('*/15 * * * *', kick);

  setTimeout(verifyKick, 25_000);
  cron.schedule('0 4 * * *', verifyKick);

  console.log('[scheduler] ingestion scheduled: on boot (+10s) and every 15 minutes');
  console.log('[scheduler] offer verification scheduled: on boot (+25s) and daily at 04:00');
}
