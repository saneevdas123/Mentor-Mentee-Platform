import dbConnect from '@/lib/db';
import CreditPlan from '@/models/CreditPlan';
import Gradesheet from '@/models/Gradesheet';
import Basket from '@/models/Basket';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';
import { computeProgress } from '@/lib/creditEngine';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  if (!(await canAccessStudent(session, params.studentId))) return error('Forbidden', 403);

  const student = await StudentProfile.findById(params.studentId)
    .select('name registrationNo programme currentSemester department school batch').lean();
  if (!student) return error('Student not found', 404);

  const [plan, gradesheets, baskets] = await Promise.all([
    CreditPlan.findOne({ student: params.studentId }).lean(),
    Gradesheet.find({ student: params.studentId }).select('-fileData').sort({ createdAt: 1 }).lean(),
    Basket.find({ department: student.department, isActive: true }).sort({ order: 1, name: 1 }).lean(),
  ]);

  const progress = computeProgress({
    plan,
    gradesheets,
    baskets,
    currentSemester: student.currentSemester,
  });

  return json({ student, plan: plan || null, baskets, gradesheets, progress });
}
