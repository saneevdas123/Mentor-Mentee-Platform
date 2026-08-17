import dbConnect from '@/lib/db';
import Basket from '@/models/Basket';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canManageAcademics } from '@/lib/access';

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!canManageAcademics(session)) return error('Forbidden', 403);

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
  if (!ids.length) return error('Basket order is required.');
  if (new Set(ids).size !== ids.length) return error('Duplicate baskets in the new order.');

  await dbConnect();
  const filter = { _id: { $in: ids }, isActive: true };
  if (session.role === 'HOD' && session.department) filter.department = session.department;
  if (session.role === 'DEAN' && session.school) filter.school = session.school;

  const found = await Basket.find(filter).select('_id').lean();
  if (found.length !== ids.length) return error('Some baskets could not be reordered.', 400);

  await Promise.all(ids.map((id, i) => Basket.findByIdAndUpdate(id, { order: i + 1 })));
  return json({ ok: true });
}
