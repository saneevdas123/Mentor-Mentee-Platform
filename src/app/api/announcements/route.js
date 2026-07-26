import dbConnect from '@/lib/db';
import Announcement from '@/models/Announcement';
import { requireRole, json } from '@/lib/apiGuard';

export async function GET() {
  const { error: e } = await requireRole('HOD');
  if (e) return e;
  await dbConnect();
  const announcements = await Announcement.find({}).sort({ createdAt: -1 }).limit(200).lean();
  return json({ announcements });
}
