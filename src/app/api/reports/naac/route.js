import { naacReport, reportFilterFromSession } from '@/lib/analytics';
import { requireRole, json, error } from '@/lib/apiGuard';

export async function GET(req) {
  const { session, error: e } = await requireRole('HOD');
  if (e) return e;
  const { filter, error: scopeErr } = reportFilterFromSession(session, new URL(req.url).searchParams);
  if (scopeErr) return error(scopeErr, 400);
  const data = await naacReport(filter);
  return json({ report: data });
}
