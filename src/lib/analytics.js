import dbConnect from '@/lib/db';
import User from '@/models/User';
import Mapping from '@/models/Mapping';
import StudentProfile from '@/models/StudentProfile';
import Meeting from '@/models/Meeting';
import Minutes from '@/models/Minutes';

function median(nums) {
  const a = nums.filter((n) => typeof n === 'number' && !isNaN(n)).sort((x, y) => x - y);
  if (!a.length) return 0;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
const pct = (n, d) => (d ? +((n / d) * 100).toFixed(2) : 0);

// Build a scope filter from optional school/department ids.
function scope({ school, department }) {
  const f = {};
  if (school) f.school = school;
  if (department) f.department = department;
  return f;
}

/**
 * NAAC report: mentor-mentee ratio (2.3.3), mentoring activity, grievances,
 * progression & support (Criterion 5).
 */
export async function naacReport(filter = {}) {
  await dbConnect();
  const sFilter = scope(filter);

  const mentorFilter = { role: 'MENTOR', isActive: true, ...sFilter };
  const mentors = await User.countDocuments(mentorFilter);
  const students = await StudentProfile.countDocuments(sFilter);
  const mappedStudents = await Mapping.countDocuments({ active: true, ...sFilter });

  const meetings = await Meeting.countDocuments(sFilter);
  const parentMeetings = await Meeting.countDocuments({ type: 'MONTHLY_PARENT', ...sFilter });
  const minutesCount = await Minutes.countDocuments(sFilter);

  // Progression (Criterion 5).
  const all = await StudentProfile.find(sFilter).lean();
  const placed = all.filter((s) => (s.placements || []).some((p) => p.type === 'PLACEMENT')).length;
  const higherStudies = all.filter((s) => (s.placements || []).some((p) => p.type === 'HIGHER_STUDIES')).length;
  const scholarshipHolders = all.filter((s) => (s.scholarships || []).length > 0).length;
  const withActivities = all.filter((s) => (s.activities || []).length > 0).length;
  const atRisk = all.filter((s) => s.riskLevel === 'HIGH').length;

  return {
    ratio: mentors ? `1 : ${Math.round(students / mentors)}` : 'N/A',
    mentors,
    students,
    mappedStudents,
    unmapped: Math.max(students - mappedStudents, 0),
    coverage: pct(mappedStudents, students),
    mentoringMeetings: meetings,
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
  const all = await StudentProfile.find(sFilter).lean();
  const total = all.length;

  const placedStudents = all.filter((s) => (s.placements || []).some((p) => p.type === 'PLACEMENT'));
  const higherStudies = all.filter((s) => (s.placements || []).some((p) => p.type === 'HIGHER_STUDIES'));
  const entrepreneurs = all.filter((s) => (s.placements || []).some((p) => p.type === 'ENTREPRENEURSHIP'));

  // Median salary across all placement offers (LPA).
  const salaries = [];
  all.forEach((s) => (s.placements || []).forEach((p) => { if (p.type === 'PLACEMENT' && p.ctcLPA) salaries.push(p.ctcLPA); }));

  const onTime = all.filter((s) => s.onTimeGraduation !== false).length;
  const withBacklogs = all.filter((s) => (s.liveBacklogs || 0) > 0).length;

  // NIRF GPH = placed % + higher studies % + entrepreneurship %.
  const gph = pct(placedStudents.length + higherStudies.length + entrepreneurs.length, total);

  return {
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
    recruiters: [...new Set(placedStudents.flatMap((s) => (s.placements || []).filter((p) => p.type === 'PLACEMENT').map((p) => p.company)).filter(Boolean))],
  };
}

/**
 * NBA Outcome-Based Education: CGPA distribution, PO/CO attainment, at-risk
 * intervention coverage.
 */
export async function nbaReport(filter = {}) {
  await dbConnect();
  const sFilter = scope(filter);
  const all = await StudentProfile.find(sFilter).lean();
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

  // Attainment averages.
  let coSum = 0, coN = 0, poSum = 0, poN = 0;
  all.forEach((s) => (s.attainments || []).forEach((a) => {
    if (typeof a.coAttainment === 'number') { coSum += a.coAttainment; coN++; }
    if (typeof a.poAttainment === 'number') { poSum += a.poAttainment; poN++; }
  }));

  const atRisk = all.filter((s) => s.riskLevel === 'HIGH');

  return {
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
    const maps = await Mapping.find({ mentor: m._id, active: true }).populate('student').lean();
    out.push({
      mentor: m.name,
      email: m.email,
      employeeId: m.employeeId || '',
      menteeCount: maps.length,
      mentees: maps.map((x) => x.student).filter(Boolean).map((s) => ({
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
