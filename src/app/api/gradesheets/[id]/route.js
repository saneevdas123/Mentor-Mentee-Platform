import dbConnect from '@/lib/db';
import Gradesheet from '@/models/Gradesheet';
import Basket from '@/models/Basket';
import CourseMap from '@/models/CourseMap';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const gs = await Gradesheet.findById(params.id).select('-fileData').populate('student', 'name registrationNo').lean();
  if (!gs) return error('Gradesheet not found', 404);
  if (!(await canAccessStudent(session, gs.student._id || gs.student))) return error('Forbidden', 403);
  return json({ gradesheet: gs });
}

// Remap course→basket and/or mark verified. Only mentor+ may verify/remap.
export async function PATCH(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (session.role === 'STUDENT') return error('Forbidden', 403);
  await dbConnect();
  const gs = await Gradesheet.findById(params.id);
  if (!gs) return error('Gradesheet not found', 404);
  if (!(await canAccessStudent(session, gs.student))) return error('Forbidden', 403);

  const body = await req.json();

  // Apply per-line basket remaps: [{ lineId, basket }]
  if (Array.isArray(body.remaps) && body.remaps.length) {
    const basketIds = body.remaps.map((r) => r.basket).filter(Boolean);
    const baskets = await Basket.find({ _id: { $in: basketIds } }).select('name').lean();
    const nameById = Object.fromEntries(baskets.map((b) => [String(b._id), b.name]));
    for (const r of body.remaps) {
      const line = gs.parsedLines.id(r.lineId) || gs.parsedLines[r.index];
      if (!line) continue;
      line.basket = r.basket || undefined;
      line.basketName = nameById[String(r.basket)] || line.basketName;
      line.mappedManually = true;
      // Remember this mapping for future uploads in the department.
      if (r.basket && line.courseCode) {
        await CourseMap.findOneAndUpdate(
          { department: gs.department, courseCode: line.courseCode },
          { department: gs.department, courseCode: line.courseCode, courseTitle: line.courseTitle, basket: r.basket, basketName: nameById[String(r.basket)], createdBy: session.sub },
          { upsert: true }
        );
      }
    }
  }

  gs.creditsEarnedTotal = gs.parsedLines.filter((l) => l.passed).reduce((a, l) => a + (l.credit || 0), 0);
  const stillUnmapped = gs.parsedLines.filter((l) => !l.basket).length;

  if (body.status === 'VERIFIED') {
    gs.status = 'VERIFIED';
    gs.verifiedBy = session.sub;
    gs.verifiedAt = new Date();
  } else {
    gs.status = stillUnmapped ? 'NEEDS_REVIEW' : 'PARSED';
  }
  await gs.save();
  const obj = gs.toObject();
  delete obj.fileData;
  return json({ ok: true, gradesheet: obj });
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const gs = await Gradesheet.findById(params.id).select('student uploadedBy');
  if (!gs) return error('Gradesheet not found', 404);
  if (!(await canAccessStudent(session, gs.student))) return error('Forbidden', 403);
  // Students may delete only their own uploads; mentor+ may delete any in scope.
  if (session.role === 'STUDENT' && String(gs.uploadedBy) !== String(session.sub)) return error('Forbidden', 403);
  await gs.deleteOne();
  return json({ ok: true });
}
