import { getSession } from '@/lib/auth';
import { json } from '@/lib/apiGuard';
import { ROLE_HOME } from '@/lib/rbac';

export async function GET() {
  const session = await getSession();
  if (!session) return json({ user: null, home: null });
  return json({
    user: {
      name: session.name,
      email: session.email,
      role: session.role,
      school: session.school,
      department: session.department,
    },
    home: ROLE_HOME[session.role] || '/',
  });
}
