import dbConnect from '@/lib/db';
import User from '@/models/User';
import Mapping from '@/models/Mapping';
import StudentProfile from '@/models/StudentProfile';
import Meeting from '@/models/Meeting';
import Minutes from '@/models/Minutes';
import School from '@/models/School';
import Department from '@/models/Department';

function median(nums) {
  const a = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n)).sort((x, y) => x - y);
  if (!a.length) return 0;
  const mid = Math.floor(a.length / 2);
  const raw = a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
  return +raw.toFixed(2);
}
const pct = (n, d) => (d ? +((n / d) * 100).toFixed(2) : 0);

const CONFIRMED = new Set(['ACCEPTED', 'JOINED']);

function hasOutcome(student, type) {
  return (student.placements || []).some((p) => p.type === type && CONFIRMED.has(p.status || 'OFFERED'));
}

function placedCtc(student) {
  const ctcs = (student.placements || [])
    .filter((p) => p.type === 'PLACEMENT' && CONFIRMED.has(p.status || 'OFFERED') && typeof p.ctcLPA === 'number')
    .map((p) => p.ctcLPA);
  return ctcs.length ? Math.max(...ctcs) : null;
}

function coValue(row) {
  if (typeof row?.coAttainment === 'number') return row.coAttainment;
  if (typeof row?.attained === 'number') return row.attained;
  if (typeof row?.level === 'number') return row.level;
  return null;
}

function poValue(row) {
  if (typeof row?.poAttainment === 'number') return row.poAttainment;
  // Older records stored one score as `attained` / `level` — use it for both.
  if (typeof row?.coAttainment !== 'number' && typeof row?.attained === 'number') return row.attained;
  if (typeof row?.coAttainment !== 'number' && typeof row?.level === 'number') return row.level;
  return null;
}

// Build a scope filter from optional school/department ids.
function scope({ school, department }) {
  const f = {};
  if (school) f.school = school;
  if (department) f.department = department;
  return f;
}

/** Enrolled (and graduated) — drop left / detained / on leave. Missing status counts as active. */
function enrolledFilter(sFilter) {
  return {
    ...sFilter,
    status: { $nin: ['DROPPED', 'DETAINED', 'ON_LEAVE'] },
  };
}

/** NIRF GO: final-year / graduated, or anyone with a confirmed outcome. */
function isGraduationCohort(s) {
  if (s.status === 'GRADUATED') return true;
  if ((s.currentSemester || 0) >= 6) return true;
  return hasOutcome(s, 'PLACEMENT') || hasOutcome(s, 'HIGHER_STUDIES') || hasOutcome(s, 'ENTREPRENEURSHIP');
}

const CONDUCTED = ['NOTIFIED', 'COMPLETED'];

export function reportFilterFromSession(session, searchParams) {
  if (session.role === 'DEAN') {
    if (!session.school) return { error: 'Dean account is not linked to a school.' };
    return { filter: { school: session.school } };
  }
  if (session.role === 'HOD') {
    if (!session.department) return { error: 'HoD account is not linked to a department.' };
    return { filter: { department: session.department } };
  }
  const filter = {};
  if (searchParams?.get('school')) filter.school = searchParams.get('school');
  if (searchParams?.get('department')) filter.department = searchParams.get('department');
  return { filter };
}

async function scopeLabel(filter) {
  if (filter.department) {
    const d = await Department.findById(filter.department).select('name code').lean();
    return d ? `${d.name} (${d.code})` : 'Department';
  }
  if (filter.school) {
    const s = await School.findById(filter.school).select('name code').lean();
    return s ? `${s.name} (${s.code})` : 'School';
  }
  return 'University-wide';
}

/**
 * NAAC report: mentor-mentee ratio (2.3.3), mentoring activity, grievances,
 * progression & support (Criterion 5).
 */
export async function naacReport(filter = {}) {
  await dbConnect();
  const sFilter = scope(filter);
  const live = enrolledFilter(sFilter);

  const mentors = await User.countDocuments({ role: 'MENTOR', isActive: true, ...sFilter });
  const all = await StudentProfile.find(live).lean();
  const students = all.length;
  const studentIds = all.map((s) => s._id);
  const mappedStudents = studentIds.length
    ? (await Mapping.distinct('student', { active: true, student: { $in: studentIds } })).length
    : 0;

  const conducted = { status: { $in: CONDUCTED }, ...sFilter };
  const mentoringMeetings = await Meeting.countDocuments({
    ...conducted,
    type: { $in: ['WEEKLY_MENTORING', 'ADHOC'] },
  });
  const parentMeetings = await Meeting.countDocuments({ ...conducted, type: 'MONTHLY_PARENT' });
  const minutesCount = await Minutes.countDocuments(sFilter);

  const placed = all.filter((s) => hasOutcome(s, 'PLACEMENT')).length;
  const higherStudies = all.filter((s) => hasOutcome(s, 'HIGHER_STUDIES')).length;
  const scholarshipHolders = all.filter((s) => (s.scholarships || []).length > 0).length;
  const withActivities = all.filter((s) => (s.activities || []).length > 0).length;
  const atRisk = all.filter((s) => s.riskLevel === 'HIGH').length;

  return {
    scope: await scopeLabel(filter),
    ratio: mentors ? `1 : ${Math.round(students / mentors)}` : 'N/A',
    mentors,
    students,
    mappedStudents,
    unmapped: Math.max(students - mappedStudents, 0),
    coverage: pct(mappedStudents, students),
    mentoringMeetings,
    parentMeetings,
    minutesRecorded: minutesCount,
    progression: {
      placedPercent: pct(placed, students),
      higherStudiesPercent: pct(higherStudies, students),
      scholarshipPercent: pct(scholarshipHolders, students),
      participationPercent: pct(withActivities, students),
    },
    atRiskStudents: atRisk,
  };
}

/**
 * NIRF Graduation Outcomes: placement %, higher-studies %, median salary,
 * on-time graduation (GUE proxy), backlogs.
 */
export async function nirfReport(filter = {}) {
  await dbConnect();
  const sFilter = scope(filter);
  const enrolled = await StudentProfile.find(enrolledFilter(sFilter)).lean();
  const all = enrolled.filter(isGraduationCohort);
  const total = all.length;

  const placedStudents = all.filter((s) => hasOutcome(s, 'PLACEMENT'));
  const higherStudies = all.filter((s) => hasOutcome(s, 'HIGHER_STUDIES'));
  const entrepreneurs = all.filter((s) => hasOutcome(s, 'ENTREPRENEURSHIP'));

  // One accepted CTC per placed student (NIRF GMS), not every offer.
  const salaries = placedStudents.map(placedCtc).filter((n) => n != null);

  const withBacklogs = all.filter((s) => (s.liveBacklogs || 0) > 0).length;
  const onTime = all.filter((s) => s.onTimeGraduation !== false && (s.liveBacklogs || 0) === 0).length;

  // Unique students in any confirmed outcome — do not double-count.
  const gphCount = all.filter((s) => (
    hasOutcome(s, 'PLACEMENT') || hasOutcome(s, 'HIGHER_STUDIES') || hasOutcome(s, 'ENTREPRENEURSHIP')
  )).length;
  const gph = pct(gphCount, total);

  return {
    scope: await scopeLabel(filter),
    totalStudents: total,
    placementPercent: pct(placedStudents.length, total),
    higherStudiesPercent: pct(higherStudies.length, total),
    entrepreneurshipPercent: pct(entrepreneurs.length, total),
    combinedGPH: gph,
    medianSalaryLPA: median(salaries),
    maxSalaryLPA: salaries.length ? Math.max(...salaries) : 0,
    minSalaryLPA: salaries.length ? Math.min(...salaries) : 0,
    onTimeGraduationPercent: pct(onTime, total),
    studentsWithLiveBacklogs: withBacklogs,
    recruiters: [...new Set(placedStudents.flatMap((s) => (s.placements || [])
      .filter((p) => p.type === 'PLACEMENT' && CONFIRMED.has(p.status || 'OFFERED'))
      .map((p) => p.company || p.institution)
      .filter(Boolean)))],
  };
}

/**
 * NBA Outcome-Based Education: CGPA distribution, PO/CO attainment, at-risk
 * intervention coverage.
 */
export async function nbaReport(filter = {}) {
  await dbConnect();
  const sFilter = scope(filter);
  const all = await StudentProfile.find(enrolledFilter(sFilter)).lean();
  const total = all.length;

  const cgpas = all.map((s) => s.latestCGPA).filter((x) => typeof x === 'number');
  const avgCGPA = cgpas.length ? +(cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : 0;

  const bands = { '9-10': 0, '8-9': 0, '7-8': 0, '6-7': 0, '<6': 0 };
  cgpas.forEach((c) => {
    if (c >= 9) bands['9-10']++;
    else if (c >= 8) bands['8-9']++;
    else if (c >= 7) bands['7-8']++;
    else if (c >= 6) bands['6-7']++;
    else bands['<6']++;
  });

  let coSum = 0, coN = 0, poSum = 0, poN = 0;
  all.forEach((s) => (s.attainments || []).forEach((a) => {
    const co = coValue(a);
    const po = poValue(a);
    if (co != null) { coSum += co; coN++; }
    if (po != null) { poSum += po; poN++; }
  }));

  const atRisk = all.filter((s) => s.riskLevel === 'HIGH');

  return {
    scope: await scopeLabel(filter),
    totalStudents: total,
    averageCGPA: avgCGPA,
    cgpaDistribution: bands,
    averageCOAttainment: coN ? +(coSum / coN).toFixed(2) : 0,
    averagePOAttainment: poN ? +(poSum / poN).toFixed(2) : 0,
    atRiskCount: atRisk.length,
    atRiskPercent: pct(atRisk.length, total),
    passPercent: pct(all.filter((s) => (s.liveBacklogs || 0) === 0).length, total),
  };
}

// Mentor-wise mentee list (NAAC requires both mentor-wise and mentee-wise lists).
export async function mentorWiseList(filter = {}) {
  await dbConnect();
  const sFilter = scope(filter);
  const mentors = await User.find({ role: 'MENTOR', isActive: true, ...sFilter }).lean();
  const out = [];
  for (const m of mentors) {
    const maps = await Mapping.find({ mentor: m._id, active: true, ...sFilter }).populate('student').lean();
    const mentees = maps.map((x) => x.student).filter((s) => s && !['DROPPED', 'DETAINED', 'ON_LEAVE'].includes(s.status));
    out.push({
      mentor: m.name,
      email: m.email,
      employeeId: m.employeeId || '',
      menteeCount: mentees.length,
      mentees: mentees.map((s) => ({
        registrationNo: s.registrationNo,
        name: s.name,
        programme: s.programme,
        cgpa: s.latestCGPA,
        risk: s.riskLevel,
      })),
    });
  }
  return out;
}
