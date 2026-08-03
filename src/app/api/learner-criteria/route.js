import dbConnect from '@/lib/db';
import LearnerCriteria from '@/models/LearnerCriteria';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { defaultCriteria } from '@/lib/learnerEngine';

function deptFor(session, searchParams) {
  if (session.role === 'HOD') return session.department;
  return searchParams.get('department') || session.department || null;
}

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const department = deptFor(session, searchParams);
  if (!department) return json({ criteria: null, defaults: defaultCriteria() });
  const criteria = await LearnerCriteria.findOne({ department }).lean();
  return json({ criteria: criteria || null, defaults: defaultCriteria() });
}

export async function PUT(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['ADMIN', 'DEAN', 'HOD'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const department = deptFor(session, searchParams);
  if (!department) return error('A department is required to save criteria.');
  const body = await req.json();
  const allowed = ['mode', 'cgpaSlowBelow', 'cgpaAdvancedAtLeast', 'attendanceMin', 'considerBacklogs',
    'considerAttendance', 'considerAttainment', 'attainmentSlowBelow', 'slowPercentile', 'advancedPercentile',
    'policyNote', 'ratifiedBy'];
  const update = { department, school: session.school, updatedBy: session.sub };
  for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];
  const criteria = await LearnerCriteria.findOneAndUpdate({ department }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
  return json({ ok: true, criteria });
}
