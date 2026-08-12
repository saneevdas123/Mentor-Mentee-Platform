import dbConnect from '@/lib/db';
import Minutes from '@/models/Minutes';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const m = await Minutes.findById(params.id).populate('mentor', 'name email').lean();
  if (!m) return error('Minutes not found', 404);
  return json({ minutes: m });
}

export async function PATCH(req, context) {
  const params = await context.params;
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['MENTOR', 'HOD', 'DEAN', 'ADMIN'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const body = await req.json();
  if (body.finalize) { body.finalized = true; body.finalizedBy = session.sub; delete body.finalize; }
  const m = await Minutes.findByIdAndUpdate(params.id, body, { new: true });
  if (!m) return error('Minutes not found', 404);
  return json({ ok: true, minutes: m });
}
