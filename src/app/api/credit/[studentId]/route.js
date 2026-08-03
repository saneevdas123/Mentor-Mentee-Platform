import dbConnect from '@/lib/db';
import CreditPlan from '@/models/CreditPlan';
import Gradesheet from '@/models/Gradesheet';
import Basket from '@/models/Basket';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent } from '@/lib/access';
import { computeProgress } from '@/lib/creditEngine';
import LearnerCriteria from '@/models/LearnerCriteria';
import { classifyStudent, cohortPercentiles, defaultCriteria, suggestedActions } from '@/lib/learnerEngine';

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  if (!(await canAccessStudent(session, params.studentId))) return error('Forbidden', 403);

  const student = await StudentProfile.findById(params.studentId)
    .select('name registrationNo programme currentSemester department school batch latestCGPA liveBacklogs attendancePercent attainments learnerOverride learnerCategory').lean();
  if (!student) return error('Student not found', 404);

  const [plan, gradesheets, baskets, criteria, cohort] = await Promise.all([
    CreditPlan.findOne({ student: params.studentId }).lean(),
    Gradesheet.find({ student: params.studentId }).select('-fileData').sort({ createdAt: 1 }).lean(),
    Basket.find({ department: student.department, isActive: true }).sort({ order: 1, name: 1 }).lean(),
    LearnerCriteria.findOne({ department: student.department }).lean(),
    StudentProfile.find({ department: student.department }).select('latestCGPA').lean(),
  ]);

  const progress = computeProgress({
    plan,
    gradesheets,
    baskets,
    currentSemester: student.currentSemester,
  });

  const pct = cohortPercentiles(cohort).get(String(student._id));
  let learner;
  if (student.learnerOverride?.category) {
    learner = { category: student.learnerOverride.category, basis: [`Set by mentor: ${student.learnerOverride.reason || 'manual override'}`], overridden: true };
  } else {
    learner = classifyStudent(student, criteria || defaultCriteria(), pct);
  }
  learner.actions = suggestedActions(learner.category);
  learner.usedDefaults = !criteria;

  return json({ student, plan: plan || null, baskets, gradesheets, progress, learner });
}
