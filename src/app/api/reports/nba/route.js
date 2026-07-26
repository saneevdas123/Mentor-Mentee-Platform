import { nbaReport } from '@/lib/analytics';
import { requireRole, json } from '@/lib/apiGuard';

export async function GET(req) {
  const { session, error: e } = await requireRole('HOD');
  if (e) return e;
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  if (session.role === 'ADMIN') {
    if (searchParams.get('school')) filter.school = searchParams.get('school');
    if (searchParams.get('department')) filter.department = searchParams.get('department');
  }
  const data = await nbaReport(filter);
  return json({ report: data });
}
