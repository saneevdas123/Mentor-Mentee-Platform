import dbConnect from '@/lib/db';
import School from '@/models/School';
import { requireRole, json, error } from '@/lib/apiGuard';

export async function PATCH(req, { params }) {
  const { error: e } = await requireRole('ADMIN');
  if (e) return e;
  await dbConnect();
  const body = await req.json();
  const school = await School.findByIdAndUpdate(params.id, body, { new: true });
  if (!school) return error('School not found', 404);
  return json({ ok: true, school });
}

export async function DELETE(req, { params }) {
  const { error: e } = await requireRole('ADMIN');
  if (e) return e;
  await dbConnect();
  await School.findByIdAndUpdate(params.id, { isActive: false });
  return json({ ok: true });
}
