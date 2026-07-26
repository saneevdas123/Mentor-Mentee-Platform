import dbConnect from '@/lib/db';
import Issue from '@/models/Issue';
import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const filter = {};
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  if (session.role === 'MENTOR') filter.mentor = session.sub;
  if (session.role === 'STUDENT') {
    const sp = await StudentProfile.findOne({ user: session.sub });
    filter.student = sp?._id;
  }
  const issues = await Issue.find(filter)
    .populate('student', 'name registrationNo').populate('mentor', 'name email')
    .sort({ createdAt: -1 }).lean();
  return json({ issues });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const body = await req.json();

  let studentId = body.student;
  let mentorId = null, dept = null, school = null;

  if (session.role === 'STUDENT') {
    const sp = await StudentProfile.findOne({ user: session.sub });
    if (!sp) return error('Student profile not found.', 404);
    studentId = sp._id;
    dept = sp.department; school = sp.school;
    const map = await Mapping.findOne({ student: sp._id, active: true });
    mentorId = map?.mentor || null;
  } else {
    const sp = await StudentProfile.findById(studentId);
    if (sp) { dept = sp.department; school = sp.school; const map = await Mapping.findOne({ student: sp._id, active: true }); mentorId = map?.mentor; }
  }

  if (!body.subject || !body.description) return error('Subject and description are required.');
  const issue = await Issue.create({
    student: studentId, raisedBy: session.sub, mentor: mentorId, department: dept, school,
    category: body.category || 'ACADEMIC', priority: body.priority || 'MEDIUM',
    subject: body.subject, description: body.description, status: 'OPEN',
  });
  return json({ ok: true, issue }, 201);
}
