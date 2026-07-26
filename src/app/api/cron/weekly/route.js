import { runWeeklyMentoring } from '@/lib/scheduler';
import { json, error } from '@/lib/apiGuard';

function authorized(req) {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.replace('Bearer ', '');
  const url = new URL(req.url);
  const q = url.searchParams.get('secret');
  return (process.env.CRON_SECRET && (bearer === process.env.CRON_SECRET || q === process.env.CRON_SECRET));
}

export async function GET(req) {
  if (!authorized(req)) return error('Unauthorized', 401);
  const dryRun = new URL(req.url).searchParams.get('dryRun') === 'true';
  const result = await runWeeklyMentoring({ dryRun });
  return json({ ok: true, task: 'WEEKLY_MENTORING', ...result });
}
export const POST = GET;
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
