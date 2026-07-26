import { mentorWiseList } from '@/lib/analytics';
import { requireRole, json } from '@/lib/apiGuard';

export async function GET() {
  const { session, error: e } = await requireRole('HOD');
  if (e) return e;
  const filter = {};
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  const list = await mentorWiseList(filter);
  return json({ list });
}
