import dbConnect from '@/lib/db';
import CreditPlan from '@/models/CreditPlan';
import Basket from '@/models/Basket';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent, canManageAcademics } from '@/lib/access';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  if (!(await canAccessStudent(session, params.studentId))) return error('Forbidden', 403);
  const plan = await CreditPlan.findOne({ student: params.studentId }).lean();
  return json({ plan: plan || null });
}

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!canManageAcademics(session)) return error('Forbidden', 403);
  await dbConnect();
  if (!(await canAccessStudent(session, params.studentId))) return error('Forbidden', 403);

  const body = await req.json();
  const student = await StudentProfile.findById(params.studentId).select('school department programme').lean();
  if (!student) return error('Student not found', 404);

  // Resolve basket names for stable display.
  const basketIds = (body.lines || []).map((l) => l.basket).filter(Boolean);
  const baskets = await Basket.find({ _id: { $in: basketIds } }).select('name').lean();
  const nameById = Object.fromEntries(baskets.map((b) => [String(b._id), b.name]));

  const lines = (body.lines || []).map((l) => ({
    basket: l.basket || undefined,
    basketName: l.basketName || nameById[String(l.basket)] || l.basketName,
    requiredCredits: Number(l.requiredCredits) || 0,
  }));
  const totalRequired = Number(body.totalRequired) || lines.reduce((a, l) => a + l.requiredCredits, 0);

  const plan = await CreditPlan.findOneAndUpdate(
    { student: params.studentId },
    {
      student: params.studentId,
      school: student.school,
      department: student.department,
      programme: student.programme,
      lines,
      totalRequired,
      creditsPerSemester: Number(body.creditsPerSemester) || 20,
      expectedSemesters: Number(body.expectedSemesters) || 8,
      updatedBy: session.sub,
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return json({ ok: true, plan });
}
