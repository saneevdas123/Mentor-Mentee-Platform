import dbConnect from '@/lib/db';
import School from '@/models/School';
import User from '@/models/User';
import Department from '@/models/Department';
import StudentProfile from '@/models/StudentProfile';
import { requireRole, json, error } from '@/lib/apiGuard';

export async function GET() {
  const { session, error: e } = await requireRole('HOD');
  if (e) return e;
  await dbConnect();
  const filter = session.role === 'ADMIN' ? {} : session.school ? { _id: session.school } : {};
  const schools = await School.find(filter).populate('dean', 'name email').sort({ name: 1 }).lean();
  // attach counts
  for (const s of schools) {
    s.departmentCount = await Department.countDocuments({ school: s._id });
    s.studentCount = await StudentProfile.countDocuments({ school: s._id });
  }
  return json({ schools });
}

export async function POST(req) {
  const { session, error: e } = await requireRole('ADMIN');
  if (e) return e;
  await dbConnect();
  const { name, code, campus, description } = await req.json();
  if (!name || !code) return error('Name and code are required.');
  const exists = await School.findOne({ code: code.toUpperCase() });
  if (exists) return error('A school with this code already exists.');
  const school = await School.create({ name, code: code.toUpperCase(), campus, description, createdBy: session.sub });
  return json({ ok: true, school }, 201);
}
