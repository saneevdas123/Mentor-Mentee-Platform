import dbConnect from '@/lib/db';
import Mapping from '@/models/Mapping';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const filter = { active: true };
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  if (session.role === 'MENTOR') filter.mentor = session.sub;
  const mappings = await Mapping.find(filter)
    .populate('mentor', 'name email').populate('student', 'name registrationNo programme latestCGPA riskLevel')
    .sort({ createdAt: -1 }).lean();
  return json({ mappings });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['ADMIN', 'DEAN', 'HOD'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const { mentorId, studentIds, academicYear } = await req.json();
  if (!mentorId || !Array.isArray(studentIds) || !studentIds.length) return error('Mentor and at least one student are required.');
  const mentor = await User.findById(mentorId);
  if (!mentor || mentor.role !== 'MENTOR') return error('Invalid mentor.');

  let mapped = 0;
  for (const sid of studentIds) {
    const student = await StudentProfile.findById(sid);
    if (!student) continue;
    await Mapping.updateOne(
      { mentor: mentorId, student: sid, academicYear: academicYear || 'current' },
      { $set: { mentor: mentorId, student: sid, department: student.department, school: student.school, academicYear: academicYear || 'current', active: true, assignedBy: session.sub } },
      { upsert: true }
    );
    mapped++;
  }
  return json({ ok: true, mapped });
}

export async function DELETE(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['ADMIN', 'DEAN', 'HOD'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await Mapping.findByIdAndUpdate(id, { active: false });
  return json({ ok: true });
}
