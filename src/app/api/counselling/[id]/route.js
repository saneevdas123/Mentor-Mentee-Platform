import dbConnect from '@/lib/db';
import Counselling from '@/models/Counselling';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const rec = await Counselling.findById(params.id);
  if (!rec) return error('Record not found', 404);
  if (!(await canAccessStudent(session, rec.student))) return error('Forbidden', 403);
  const b = await req.json();

  if (session.role === 'STUDENT') {
    // Students may only acknowledge a record addressed to them.
    if (b.studentAcknowledged) {
      rec.studentAcknowledged = true;
      rec.acknowledgedAt = new Date();
      await rec.save();
      return json({ ok: true, record: rec });
    }
    return error('Forbidden', 403);
  }

  const editable = ['subject', 'summary', 'advice', 'mode', 'followUpOn', 'occurredOn', 'requestStatus', 'recommendations'];
  for (const k of editable) if (k in b) rec[k] = b[k];
  await rec.save();
  return json({ ok: true, record: rec });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (session.role === 'STUDENT') return error('Forbidden', 403);
  await dbConnect();
  const rec = await Counselling.findById(params.id).select('student');
  if (!rec) return error('Record not found', 404);
  if (!(await canAccessStudent(session, rec.student))) return error('Forbidden', 403);
  await rec.deleteOne();
  return json({ ok: true });
}
