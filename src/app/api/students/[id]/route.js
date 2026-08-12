import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';
// Register models used by populate()
import '@/models/Department';
import '@/models/School';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';

async function canEdit(session, studentId) {
  if (['ADMIN', 'DEAN', 'HOD'].includes(session.role)) return true;
  if (session.role === 'MENTOR') {
    const m = await Mapping.findOne({ mentor: session.sub, student: studentId, active: true });
    return !!m;
  }
  return false;
}

export async function GET(req, context) {
  const params = await context.params;
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const student = await StudentProfile.findById(params.id).populate('department', 'name code').populate('school', 'name code').lean();
  if (!student) return error('Student not found', 404);
  if (session.role === 'STUDENT' && String(student.user) !== session.sub) return error('Forbidden', 403);
  return json({ student });
}

export async function PATCH(req, context) {
  const params = await context.params;
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  if (!(await canEdit(session, params.id))) return error('Forbidden', 403);
  const body = await req.json();

  // Recompute derived fields when semester results are present.
  if (Array.isArray(body.semesterResults) && body.semesterResults.length) {
    const last = body.semesterResults[body.semesterResults.length - 1];
    if (last?.cgpa != null) body.latestCGPA = last.cgpa;
    body.liveBacklogs = body.semesterResults.reduce((a, r) => a + (r.backlogs || 0), 0);
  }
  body.updatedByMentorAt = new Date();

  const student = await StudentProfile.findByIdAndUpdate(params.id, body, { new: true });
  if (!student) return error('Student not found', 404);
  return json({ ok: true, student });
}
