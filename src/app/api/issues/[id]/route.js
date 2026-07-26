import dbConnect from '@/lib/db';
import Issue from '@/models/Issue';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { message, status } = await req.json();
  const issue = await Issue.findById(params.id);
  if (!issue) return error('Issue not found', 404);
  if (message) {
    issue.responses.push({ by: session.sub, byName: session.name, byRole: session.role, message, at: new Date() });
  }
  if (status && ['ADMIN', 'DEAN', 'HOD', 'MENTOR'].includes(session.role)) {
    issue.status = status;
    if (status === 'RESOLVED' || status === 'CLOSED') issue.resolvedAt = new Date();
  }
  await issue.save();
  return json({ ok: true, issue });
}
