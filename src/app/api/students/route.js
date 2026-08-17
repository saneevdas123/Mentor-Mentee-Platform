import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';
// Register models used by populate()
import '@/models/Department';
import '@/models/School';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { provisionUser } from '@/lib/provision';

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
  if (!['ADMIN', 'DEAN', 'HOD', 'MENTOR'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const body = await req.json();
  if (!body.registrationNo || !body.name) return error('Registration number and name are required.');

  const email = String(body.email || '').trim().toLowerCase();
  const issueCredentials = body.issueCredentials !== false;
  if (issueCredentials && !email) return error('Email is required to send login credentials.');

  const exists = await StudentProfile.findOne({ registrationNo: body.registrationNo });
  if (exists) return error('A student with this registration number already exists.', 409);

  const school = session.role === 'ADMIN' ? (body.school || session.school) : session.school;
  const department = session.role === 'ADMIN' || session.role === 'DEAN'
    ? (body.department || session.department)
    : session.department;

  const student = await StudentProfile.create({
    ...body,
    email: email || undefined,
    school,
    department,
    createdBy: session.sub,
  });

  let tempPassword = null;
  let credentialsEmailed = false;
  if (issueCredentials && email) {
    try {
      const provisioned = await provisionUser({
        name: body.name,
        email,
        role: 'STUDENT',
        phone: body.phone,
        school,
        department,
        createdBy: session.sub,
      });
      student.user = provisioned.user._id;
      await student.save();
      tempPassword = provisioned.tempPassword;
      credentialsEmailed = true;
    } catch (e) {
      console.warn('[students] credential email failed:', e.message);
    }
  }

  if (session.role === 'MENTOR') {
    await Mapping.updateOne(
      { mentor: session.sub, student: student._id, academicYear: body.batch || 'current' },
      {
        $set: {
          mentor: session.sub,
          student: student._id,
          department,
          school,
          academicYear: body.batch || 'current',
          active: true,
          assignedBy: session.sub,
        },
      },
      { upsert: true }
    );
  }

  return json({ ok: true, student, tempPassword, credentialsEmailed }, 201);
}
