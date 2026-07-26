import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { currentPassword, newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8) return error('New password must be at least 8 characters.');

  const user = await User.findById(session.sub);
  if (!user) return error('User not found', 404);

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return error('Current password is incorrect.');

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
  return json({ ok: true });
}
