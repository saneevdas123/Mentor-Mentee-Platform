import { getSession } from '@/lib/auth';
import { json } from '@/lib/apiGuard';

export async function GET() {
  const session = await getSession();
  if (!session) return json({ user: null });
  return json({ user: { name: session.name, email: session.email, role: session.role, school: session.school, department: session.department } });
}
