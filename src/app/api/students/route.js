import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';
// Register models used by populate()
import '@/models/Department';
import '@/models/School';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const filter = {};
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  if (session.role === 'MENTOR') {
    const maps = await Mapping.find({ mentor: session.sub, active: true }).select('student').lean();
    filter._id = { $in: maps.map((m) => m.student) };
  }
  if (session.role === 'STUDENT') filter.user = session.sub;
  const q = searchParams.get('q');
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { registrationNo: new RegExp(q, 'i') }];

  const students = await StudentProfile.find(filter)
    .populate('department', 'name code').populate('school', 'name code')
    .sort({ name: 1 }).lean();
  return json({ students });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['ADMIN', 'DEAN', 'HOD'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const body = await req.json();
  if (!body.registrationNo || !body.name) return error('Registration number and name are required.');
  const exists = await StudentProfile.findOne({ registrationNo: body.registrationNo });
  if (exists) return error('A student with this registration number already exists.', 409);
  const student = await StudentProfile.create({
    ...body,
    school: session.role === 'HOD' || session.role === 'DEAN' ? session.school : body.school,
    department: session.role === 'HOD' ? session.department : body.department,
    createdBy: session.sub,
  });
  return json({ ok: true, student }, 201);
}
