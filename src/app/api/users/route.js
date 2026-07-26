import dbConnect from '@/lib/db';
import User from '@/models/User';
import School from '@/models/School';
import Department from '@/models/Department';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canCreateRole } from '@/lib/rbac';
import { provisionUser } from '@/lib/provision';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');
  const filter = {};
  if (role) filter.role = role;
  // scope
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  const users = await User.find(filter, 'name email role phone employeeId designation isActive school department lastLoginAt createdAt')
    .populate('school', 'name code').populate('department', 'name code').sort({ createdAt: -1 }).lean();
  return json({ users });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const body = await req.json();
  const { name, email, role } = body;
  if (!name || !email || !role) return error('Name, email and role are required.');
  if (!canCreateRole(session.role, role)) return error(`Your role cannot create a ${role}.`, 403);

  // Determine scope for the new user.
  let school = body.school || null;
  let department = body.department || null;
  if (session.role === 'ADMIN' && role === 'DEAN') { school = body.school; }
  if (session.role === 'DEAN') { school = session.school; }
  if (session.role === 'HOD') { school = session.school; department = session.department; }

  try {
    const { user, tempPassword } = await provisionUser({
      name, email, role,
      phone: body.phone, employeeId: body.employeeId, designation: body.designation,
      school, department, createdBy: session.sub,
    });

    // Link dean -> school, hod -> department for convenience.
    if (role === 'DEAN' && school) await School.findByIdAndUpdate(school, { dean: user._id });
    if (role === 'HOD' && department) await Department.findByIdAndUpdate(department, { hod: user._id });

    return json({ ok: true, user: { _id: user._id, name: user.name, email: user.email, role }, tempPassword }, 201);
  } catch (err) {
    if (err.code === 'DUP') return error(err.message, 409);
    return error(err.message || 'Failed to create user', 500);
  }
}
