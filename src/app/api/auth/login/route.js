import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { ROLE_HOME } from '@/lib/rbac';

export async function POST(req) {
  await dbConnect();
  const { email, password } = await req.json();
  if (!email || !password) return error('Email and password are required.');

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !user.isActive) return error('Invalid credentials.', 401);

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return error('Invalid credentials.', 401);

  user.lastLoginAt = new Date();
  await user.save();

  const token = await createToken(user);
  await setSessionCookie(token);

  return json({
    ok: true,
    user: { name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword },
    home: ROLE_HOME[user.role] || '/',
  });
}
