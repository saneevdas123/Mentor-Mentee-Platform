import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';
import LearnerCriteria from '@/models/LearnerCriteria';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { classifyStudent, cohortPercentiles, defaultCriteria } from '@/lib/learnerEngine';

// Resolve the department cohort + the visible subset for this session.
async function resolveScope(session) {
  const department = session.department || null;
  let visibleFilter = {};
  if (session.role === 'MENTOR') {
    const maps = await Mapping.find({ mentor: session.sub, active: true }).select('student').lean();
    visibleFilter._id = { $in: maps.map((m) => m.student) };
  } else if (session.role === 'HOD') {
    visibleFilter.department = session.department;
  } else if (session.role === 'DEAN') {
    visibleFilter.school = session.school;
  } else if (session.role === 'ADMIN') {
    // all
  } else {
    visibleFilter.user = session.sub;
  }
  return { department, visibleFilter };
}

export async function GET() {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { department, visibleFilter } = await resolveScope(session);

  // Cohort for percentile: the department (fall back to the visible set).
  const cohort = department
    ? await StudentProfile.find({ department }).select('latestCGPA').lean()
    : await StudentProfile.find(visibleFilter).select('latestCGPA').lean();
  const pct = cohortPercentiles(cohort);

  const criteria = (department && (await LearnerCriteria.findOne({ department }).lean())) || defaultCriteria();

  const students = await StudentProfile.find(visibleFilter)
    .select('name registrationNo latestCGPA liveBacklogs attendancePercent attainments learnerOverride')
    .sort({ name: 1 }).lean();

  const ops = [];
  const list = students.map((s) => {
    let result;
    if (s.learnerOverride?.category) {
      result = { category: s.learnerOverride.category, basis: [`Set by mentor: ${s.learnerOverride.reason || 'manual override'}`], score: null, overridden: true };
    } else {
      result = classifyStudent(s, criteria, pct.get(String(s._id)));
    }
    ops.push({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { learnerCategory: result.category, learnerBasis: result.basis, learnerScore: result.score ?? undefined, learnerComputedAt: new Date() } },
      },
    });
    return { _id: s._id, name: s.name, registrationNo: s.registrationNo, latestCGPA: s.latestCGPA ?? null, liveBacklogs: s.liveBacklogs || 0, ...result };
  });
  if (ops.length) await StudentProfile.bulkWrite(ops);

  const summary = { ADVANCED: 0, AVERAGE: 0, SLOW: 0 };
  list.forEach((l) => { summary[l.category] = (summary[l.category] || 0) + 1; });
  return json({ learners: list, summary, usedDefaults: !(department && (await LearnerCriteria.exists({ department }))) });
}
