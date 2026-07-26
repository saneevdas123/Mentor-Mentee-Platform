import dbConnect from '@/lib/db';
import Department from '@/models/Department';
import User from '@/models/User';
import StudentProfile from '@/models/StudentProfile';
import { requireRole, json, error } from '@/lib/apiGuard';

export async function GET(req) {
  const { session, error: e } = await requireRole('MENTOR');
  if (e) return e;
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get('school');
  const filter = {};
  if (session.role === 'ADMIN') { if (schoolId) filter.school = schoolId; }
  else if (session.role === 'DEAN') filter.school = session.school;
  else filter.department = session.department;
  const departments = await Department.find(session.role === 'HOD' || session.role === 'MENTOR' ? { _id: session.department } : filter)
    .populate('hod', 'name email').populate('school', 'name code').sort({ name: 1 }).lean();
  for (const d of departments) d.studentCount = await StudentProfile.countDocuments({ department: d._id });
  return json({ departments });
}

export async function POST(req) {
  const { session, error: e } = await requireRole('DEAN');
  if (e) return e;
  await dbConnect();
  const { name, code, school, programmes } = await req.json();
  const schoolId = session.role === 'DEAN' ? session.school : school;
  if (!name || !code || !schoolId) return error('Name, code and school are required.');
  const exists = await Department.findOne({ school: schoolId, code: code.toUpperCase() });
  if (exists) return error('A department with this code already exists in this school.');
  const dept = await Department.create({ name, code: code.toUpperCase(), school: schoolId, programmes: programmes || [], createdBy: session.sub });
  return json({ ok: true, department: dept }, 201);
}
