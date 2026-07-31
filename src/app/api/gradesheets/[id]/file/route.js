import dbConnect from '@/lib/db';
import Gradesheet from '@/models/Gradesheet';
import { getSession } from '@/lib/auth';
import { error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const gs = await Gradesheet.findById(params.id).select('fileData fileName mimeType student').lean();
  if (!gs || !gs.fileData) return error('File not found', 404);
  if (!(await canAccessStudent(session, gs.student))) return error('Forbidden', 403);
  const body = gs.fileData.buffer instanceof ArrayBuffer ? gs.fileData : Buffer.from(gs.fileData);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': gs.mimeType || 'application/pdf',
      'Content-Disposition': `inline; filename="${(gs.fileName || 'gradesheet.pdf').replace(/"/g, '')}"`,
    },
  });
}
