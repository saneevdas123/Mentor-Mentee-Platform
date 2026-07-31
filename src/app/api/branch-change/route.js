import dbConnect from '@/lib/db';
import BranchChangeRequest from '@/models/BranchChangeRequest';
import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { studentIdsInScope, canAccessStudent } from '@/lib/access';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const filter = {};
  const studentId = searchParams.get('studentId');
  if (studentId) {
    if (!(await canAccessStudent(session, studentId))) return error('Forbidden', 403);
    filter.student = studentId;
  } else {
    const ids = await studentIdsInScope(session);
    if (ids) filter.student = { $in: ids };
  }
  const status = searchParams.get('status');
  if (status) filter.status = status;
  const requests = await BranchChangeRequest.find(filter)
    .populate('student', 'name registrationNo programme currentSemester')
    .populate('mentor', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return json({ requests });
}

// Students raise their own request; a mentor/HoD may raise on behalf.
export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const b = await req.json();

  let studentId = b.student;
  if (session.role === 'STUDENT') {
    const sp = await StudentProfile.findOne({ user: session.sub }).select('_id').lean();
    if (!sp) return error('No student profile is linked to your account.', 404);
    studentId = sp._id;
  }
  if (!studentId) return error('student is required.');
  if (!(await canAccessStudent(session, studentId))) return error('Forbidden', 403);
  if (!b.requestedProgramme) return error('Requested programme is required.');

  const student = await StudentProfile.findById(studentId)
    .select('programme currentSemester latestCGPA department school').lean();

  // Branch change is only for first-year students.
  const sem = student.currentSemester;
  if (sem != null && sem > 2) {
    return error('Branch change requests are only allowed for first-year students (semester 1–2).', 422);
  }

  // Existing open request guard.
  const open = await BranchChangeRequest.findOne({ student: studentId, status: { $in: ['REQUESTED', 'COUNSELLED', 'RECOMMENDED', 'NOT_RECOMMENDED'] } }).lean();
  if (open) return error('There is already an open branch-change request for this student.', 409);

  const map = await Mapping.findOne({ student: studentId, active: true }).select('mentor').lean();

  const request = await BranchChangeRequest.create({
    student: studentId,
    mentor: map?.mentor,
    department: student.department,
    school: student.school,
    currentProgramme: student.programme,
    requestedProgramme: b.requestedProgramme,
    reason: b.reason,
    currentCGPA: student.latestCGPA,
    status: 'REQUESTED',
    raisedBy: session.sub,
  });
  return json({ ok: true, request }, 201);
}
