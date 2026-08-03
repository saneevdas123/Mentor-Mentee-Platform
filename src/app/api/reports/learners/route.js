import dbConnect from '@/lib/db';
import StudentProfile from '@/models/StudentProfile';
import LearnerCriteria from '@/models/LearnerCriteria';
import Mapping from '@/models/Mapping';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { classifyStudent, cohortPercentiles, defaultCriteria, suggestedActions, CATEGORY_LABELS } from '@/lib/learnerEngine';
import { buildExport } from '@/lib/excel';

export const dynamic = 'force-dynamic';

async function scopeFilter(session) {
  if (session.role === 'HOD') return { department: session.department };
  if (session.role === 'DEAN') return { school: session.school };
  if (session.role === 'MENTOR') {
    const maps = await Mapping.find({ mentor: session.sub, active: true }).select('student').lean();
    return { _id: { $in: maps.map((m) => m.student) } };
  }
  return {}; // ADMIN
}

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['ADMIN', 'DEAN', 'HOD', 'MENTOR'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const filter = await scopeFilter(session);
  const department = session.department || null;
  const criteria = (department && (await LearnerCriteria.findOne({ department }).lean())) || defaultCriteria();

  const cohort = department
    ? await StudentProfile.find({ department }).select('latestCGPA').lean()
    : await StudentProfile.find(filter).select('latestCGPA').lean();
  const pct = cohortPercentiles(cohort);

  const students = await StudentProfile.find(filter)
    .select('name registrationNo programme currentSemester latestCGPA liveBacklogs attendancePercent attainments learnerOverride')
    .populate('department', 'name code').sort({ name: 1 }).lean();

  const rows = students.map((s) => {
    const r = s.learnerOverride?.category
      ? { category: s.learnerOverride.category, basis: [`Mentor override: ${s.learnerOverride.reason || ''}`] }
      : classifyStudent(s, criteria, pct.get(String(s._id)));
    return {
      name: s.name, regNo: s.registrationNo, programme: s.programme || '',
      semester: s.currentSemester ?? '', cgpa: s.latestCGPA ?? '', backlogs: s.liveBacklogs || 0,
      attendance: s.attendancePercent ?? '', category: CATEGORY_LABELS[r.category], categoryCode: r.category,
      basis: (r.basis || []).join('; '), interventions: suggestedActions(r.category).join('; '),
    };
  });

  const summary = { ADVANCED: 0, AVERAGE: 0, SLOW: 0 };
  rows.forEach((r) => { summary[r.categoryCode] = (summary[r.categoryCode] || 0) + 1; });

  if (searchParams.get('format') === 'xlsx') {
    const buffer = await buildExport([
      {
        sheetName: 'Learner Levels',
        columns: [
          { header: 'Name', key: 'name', width: 24 },
          { header: 'Reg. No', key: 'regNo', width: 16 },
          { header: 'Programme', key: 'programme', width: 18 },
          { header: 'Sem', key: 'semester', width: 6 },
          { header: 'CGPA', key: 'cgpa', width: 8 },
          { header: 'Backlogs', key: 'backlogs', width: 9 },
          { header: 'Attendance %', key: 'attendance', width: 12 },
          { header: 'Category', key: 'category', width: 18 },
          { header: 'Basis', key: 'basis', width: 46 },
          { header: 'Interventions', key: 'interventions', width: 50 },
        ],
        rows,
      },
      {
        sheetName: 'Summary',
        columns: [
          { header: 'Category', key: 'category', width: 20 },
          { header: 'Students', key: 'count', width: 12 },
        ],
        rows: [
          { category: 'Advanced learners', count: summary.ADVANCED },
          { category: 'Average learners', count: summary.AVERAGE },
          { category: 'Slow learners', count: summary.SLOW },
          { category: 'Total', count: rows.length },
        ],
      },
    ]);
    const fname = `CUTM-Learner-Levels-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fname}"`,
      },
    });
  }

  return json({ summary, total: rows.length, rows, criteria, policyNote: criteria.policyNote || defaultCriteria().policyNote, ratifiedBy: criteria.ratifiedBy || '' });
}
