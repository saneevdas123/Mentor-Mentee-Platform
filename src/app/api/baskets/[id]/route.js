import dbConnect from '@/lib/db';
import Basket from '@/models/Basket';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canManageAcademics } from '@/lib/access';

export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!canManageAcademics(session)) return error('Forbidden', 403);
  await dbConnect();
  const b = await req.json();
  if (b.aliases && !Array.isArray(b.aliases)) {
    b.aliases = String(b.aliases).split(',').map((s) => s.trim()).filter(Boolean);
  }
  const basket = await Basket.findByIdAndUpdate(params.id, b, { new: true });
  if (!basket) return error('Basket not found', 404);
  return json({ ok: true, basket });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!canManageAcademics(session)) return error('Forbidden', 403);
  await dbConnect();
  // Soft-delete so historical plans/gradesheets keep their labels.
  await Basket.findByIdAndUpdate(params.id, { isActive: false });
  return json({ ok: true });
}
