/**
 * Optional self-hosted scheduler. Use this ONLY when NOT relying on Vercel Cron
 * or an external scheduler. It triggers the same /api/cron endpoints on a cron
 * schedule using node-cron. Run with: npm run worker  (keep process alive).
 *
 * Requires: APP_URL and CRON_SECRET set in .env, and ENABLE_INTERNAL_SCHEDULER=true
 */
require('dotenv').config();
const cron = require('node-cron');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const SECRET = process.env.CRON_SECRET;
const TZ = process.env.SCHEDULE_TZ || 'Asia/Kolkata';

if (process.env.ENABLE_INTERNAL_SCHEDULER !== 'true') {
  console.log('ENABLE_INTERNAL_SCHEDULER is not "true" — worker will idle. Set it to enable.');
}

async function hit(path) {
  try {
    const res = await fetch(`${APP_URL}${path}`, { headers: { Authorization: `Bearer ${SECRET}` } });
    const data = await res.json();
    console.log(`[worker] ${path} ->`, JSON.stringify(data).slice(0, 200));
  } catch (e) {
    console.error(`[worker] ${path} failed:`, e.message);
  }
}

// Weekly: run every Monday 08:00 (creates meeting for the configured slot & notifies).
cron.schedule('0 8 * * 1', () => hit('/api/cron/weekly'), { timezone: TZ });
// Monthly: run on the 1st at 08:00.
cron.schedule('0 8 1 * *', () => hit('/api/cron/monthly'), { timezone: TZ });

console.log(`[worker] scheduler started (TZ=${TZ}). Weekly=Mon 08:00, Monthly=1st 08:00.`);
