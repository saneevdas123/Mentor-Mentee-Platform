import dbConnect from '@/lib/db';
import Basket from '@/models/Basket';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canManageAcademics } from '@/lib/access';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const filter = { isActive: true };
  if (session.role === 'DEAN') filter.school = session.school;
  if (['HOD', 'MENTOR', 'STUDENT'].includes(session.role) && session.department) filter.department = session.department;
  const programme = searchParams.get('programme');
  if (programme) filter.$or = [{ programme }, { programme: { $in: [null, ''] } }];
  const baskets = await Basket.find(filter).sort({ order: 1, name: 1 }).lean();
  return json({ baskets });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!canManageAcademics(session)) return error('Forbidden', 403);
  await dbConnect();
  const b = await req.json();
  if (!b.name) return error('Basket name is required.');
  try {
    const basket = await Basket.create({
      name: b.name,
      code: b.code,
      description: b.description,
      aliases: Array.isArray(b.aliases) ? b.aliases : (b.aliases ? String(b.aliases).split(',').map((s) => s.trim()).filter(Boolean) : []),
      defaultCredits: Number(b.defaultCredits) || 0,
      order: Number(b.order) || 0,
      programme: b.programme || undefined,
      school: session.school,
      department: session.department,
      createdBy: session.sub,
    });
    return json({ ok: true, basket }, 201);
  } catch (e) {
    if (e.code === 11000) return error('A basket with this name already exists in your department.', 409);
    return error(e.message);
  }
}
