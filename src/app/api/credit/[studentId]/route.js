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

  const verified = gradesheets.filter((g) => g.status === 'VERIFIED');
  const pending = gradesheets.filter((g) => g.status !== 'VERIFIED');

  // Official tracker uses mentor-verified gradesheets only.
  const progress = computeProgress({
    plan,
    gradesheets: verified,
    baskets,
    currentSemester: student.currentSemester,
  });

  // Provisional view includes unverified uploads so mentors can preview before verify.
  const provisional = pending.length
    ? computeProgress({
      plan,
      gradesheets,
      baskets,
      currentSemester: student.currentSemester,
    })
    : null;

  return json({
    student,
    plan: plan || null,
    baskets,
    gradesheets,
    progress: {
      ...progress,
      verifiedSheets: verified.length,
      pendingSheets: pending.length,
      provisional,
    },
  });
}
