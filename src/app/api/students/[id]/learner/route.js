import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['ADMIN', 'DEAN', 'HOD', 'MENTOR'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  if (!(await canAccessStudent(session, params.id))) return error('Forbidden', 403);

  const { category, reason, clear } = await req.json();
  const student = await StudentProfile.findById(params.id);
  if (!student) return error('Student not found', 404);

  if (clear) {
    student.learnerOverride = undefined;
  } else {
    if (!['ADVANCED', 'AVERAGE', 'SLOW'].includes(category)) return error('Invalid category.');
    student.learnerOverride = { category, reason: reason || '', by: session.sub, byName: session.name, at: new Date() };
    student.learnerCategory = category;
  }
  await student.save();
  return json({ ok: true, learnerCategory: student.learnerCategory, learnerOverride: student.learnerOverride });
}
