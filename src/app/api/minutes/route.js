import dbConnect from '@/lib/db';
import Minutes from '@/models/Minutes';
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
  const minutes = await Minutes.find(filter).populate('mentor', 'name email').sort({ heldOn: -1 }).limit(200).lean();
  return json({ minutes });
}
