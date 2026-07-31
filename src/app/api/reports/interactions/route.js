import dbConnect from '@/lib/db';
import Counselling from '@/models/Counselling';
import BranchChangeRequest from '@/models/BranchChangeRequest';
import Gradesheet from '@/models/Gradesheet';
import Minutes from '@/models/Minutes';
import Meeting from '@/models/Meeting';
import CreditPlan from '@/models/CreditPlan';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { error } from '@/lib/apiGuard';
import { studentIdsInScope, canAccessStudent } from '@/lib/access';
import { buildExport } from '@/lib/excel';
import { computeProgress } from '@/lib/creditEngine';

export const dynamic = 'force-dynamic';

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const kindLabel = (k) => (k || '').replace(/_/g, ' ');

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const scope = {};
  let scopedIds = null;
  if (studentId) {
    if (!(await canAccessStudent(session, studentId))) return error('Forbidden', 403);
    scope.student = studentId;
    scopedIds = [studentId];
  } else {
    scopedIds = await studentIdsInScope(session);
    if (scopedIds) scope.student = { $in: scopedIds };
  }

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  const hasDate = Object.keys(dateFilter).length > 0;

  const counselQ = { ...scope };
  if (hasDate) counselQ.occurredOn = dateFilter;

  const branchQ = { ...scope };
  if (hasDate) branchQ.createdAt = dateFilter;

  const gsQ = { ...scope };
  if (hasDate) gsQ.createdAt = dateFilter;

  // Meetings / minutes are mentor-scoped rather than student-scoped.
  const meetingQ = {};
  if (session.role === 'MENTOR') meetingQ.mentor = session.sub;
  else if (session.role === 'HOD' && session.department) meetingQ.department = session.department;
  else if (session.role === 'DEAN' && session.school) meetingQ.school = session.school;
  if (hasDate) meetingQ.scheduledAt = dateFilter;

  const minutesQ = {};
  if (session.role === 'MENTOR') minutesQ.mentor = session.sub;
  else if (session.role === 'HOD' && session.department) minutesQ.department = session.department;
  else if (session.role === 'DEAN' && session.school) minutesQ.school = session.school;
  if (hasDate) minutesQ.heldOn = dateFilter;

  const [records, branch, sheets, meetings, minutes] = await Promise.all([
    Counselling.find(counselQ).populate('student', 'name registrationNo programme').populate('mentor', 'name').sort({ occurredOn: -1 }).lean(),
    BranchChangeRequest.find(branchQ).populate('student', 'name registrationNo').populate('mentor', 'name').sort({ createdAt: -1 }).lean(),
    Gradesheet.find(gsQ).select('-fileData').populate('student', 'name registrationNo').sort({ createdAt: -1 }).lean(),
    Meeting.find(meetingQ).populate('mentor', 'name').sort({ scheduledAt: -1 }).lean(),
    Minutes.find(minutesQ).populate('mentor', 'name').sort({ heldOn: -1 }).lean(),
  ]);

  // Credit summary for scoped students (verified sheets only).
  const studentFilter = scopedIds ? { _id: { $in: scopedIds } } : {};
  const students = await StudentProfile.find(studentFilter)
    .select('name registrationNo programme currentSemester department')
    .lean();
  const studentIds = students.map((s) => s._id);
  const [plans, verifiedSheets] = await Promise.all([
    CreditPlan.find({ student: { $in: studentIds } }).lean(),
    Gradesheet.find({ student: { $in: studentIds }, status: 'VERIFIED' }).select('-fileData').lean(),
  ]);
  const planByStudent = new Map(plans.map((p) => [String(p.student), p]));
  const sheetsByStudent = new Map();
  for (const g of verifiedSheets) {
    const k = String(g.student);
    if (!sheetsByStudent.has(k)) sheetsByStudent.set(k, []);
    sheetsByStudent.get(k).push(g);
  }

  const creditRows = students.map((s) => {
    const plan = planByStudent.get(String(s._id));
    const progress = computeProgress({
      plan,
      gradesheets: sheetsByStudent.get(String(s._id)) || [],
      currentSemester: s.currentSemester,
    });
    return {
      student: s.name,
      regNo: s.registrationNo,
      programme: s.programme || '',
      semester: s.currentSemester ?? '',
      hasPlan: progress.hasPlan ? 'Yes' : 'No',
      required: progress.totalRequired,
      earned: progress.earnedTotal,
      remaining: progress.totalRemaining,
      pct: progress.overallPct,
      onTrack: progress.onTrack == null ? '' : progress.onTrack ? 'Yes' : 'No',
      nextFocus: (progress.recommendations || []).slice(0, 3).map((r) => `${r.basketName}: ${r.creditsToTake}cr`).join(' | '),
    };
  });

  const interactionRows = records.map((r) => ({
    date: fmt(r.occurredOn),
    student: r.student?.name,
    regNo: r.student?.registrationNo,
    programme: r.student?.programme || '',
    mentor: r.mentor?.name || '',
    kind: kindLabel(r.kind),
    mode: (r.mode || '').replace(/_/g, ' '),
    subject: r.subject || '',
    summary: r.summary || '',
    advice: r.advice || '',
    recommendations: (r.recommendations || []).map((x) => `${x.basketName || ''}: ${x.credits || ''}cr ${x.suggestedCourses || ''}`).join(' | '),
    followUp: fmt(r.followUpOn),
    acknowledged: r.studentAcknowledged ? 'Yes' : 'No',
  }));

  const branchRows = branch.map((r) => ({
    date: fmt(r.createdAt),
    student: r.student?.name,
    regNo: r.student?.registrationNo,
    from: r.currentProgramme || '',
    to: r.requestedProgramme,
    reason: r.reason || '',
    cgpa: r.currentCGPA ?? '',
    mentor: r.mentor?.name || '',
    mentorRemarks: r.mentorRemarks || '',
    mentorRecommends: r.mentorRecommends == null ? '' : r.mentorRecommends ? 'Yes' : 'No',
    status: r.status,
    decisionRemarks: r.decisionRemarks || '',
    decidedOn: fmt(r.decisionOn),
  }));

  const gsRows = sheets.map((g) => ({
    date: fmt(g.createdAt),
    student: g.student?.name,
    regNo: g.student?.registrationNo,
    title: g.title || '',
    semester: g.semester ?? '',
    creditsEarned: g.creditsEarnedTotal ?? 0,
    status: g.status,
    courses: (g.parsedLines || []).length,
    verifiedOn: fmt(g.verifiedAt),
  }));

  const meetingRows = meetings.map((m) => ({
    date: fmt(m.scheduledAt),
    title: m.title || '',
    type: (m.type || '').replace(/_/g, ' '),
    mentor: m.mentor?.name || '',
    status: m.status,
    meetLink: m.meetLink || '',
    mentees: (m.menteeEmails || []).join(', '),
    agenda: m.agenda || '',
  }));

  const minutesRows = minutes.map((m) => ({
    date: fmt(m.heldOn),
    title: m.title || '',
    type: (m.type || '').replace(/_/g, ' '),
    mentor: m.mentor?.name || '',
    finalized: m.finalized ? 'Yes' : 'Draft',
    present: (m.attendees || []).filter((a) => a.present).length,
    attendees: (m.attendees || []).length,
    agenda: m.agenda || '',
    discussion: m.discussion || '',
    decisions: m.decisions || '',
    actionItems: (m.actionItems || []).map((a) => a.item).filter(Boolean).join(' | '),
  }));

  const buffer = await buildExport([
    {
      sheetName: 'Credit Tracker',
      columns: [
        { header: 'Student', key: 'student', width: 22 },
        { header: 'Reg. No', key: 'regNo', width: 16 },
        { header: 'Programme', key: 'programme', width: 18 },
        { header: 'Sem', key: 'semester', width: 8 },
        { header: 'Plan Set', key: 'hasPlan', width: 10 },
        { header: 'Required', key: 'required', width: 10 },
        { header: 'Earned', key: 'earned', width: 10 },
        { header: 'Remaining', key: 'remaining', width: 10 },
        { header: '%', key: 'pct', width: 8 },
        { header: 'On Track', key: 'onTrack', width: 10 },
        { header: 'Next Focus (CBCS)', key: 'nextFocus', width: 40 },
      ],
      rows: creditRows,
    },
    {
      sheetName: 'Interactions',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Student', key: 'student', width: 22 },
        { header: 'Reg. No', key: 'regNo', width: 16 },
        { header: 'Programme', key: 'programme', width: 18 },
        { header: 'Mentor', key: 'mentor', width: 20 },
        { header: 'Kind', key: 'kind', width: 18 },
        { header: 'Mode', key: 'mode', width: 12 },
        { header: 'Subject', key: 'subject', width: 28 },
        { header: 'Summary', key: 'summary', width: 40 },
        { header: 'Advice', key: 'advice', width: 40 },
        { header: 'Recommendations', key: 'recommendations', width: 40 },
        { header: 'Follow-up', key: 'followUp', width: 12 },
        { header: 'Ack.', key: 'acknowledged', width: 8 },
      ],
      rows: interactionRows,
    },
    {
      sheetName: 'Meetings',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Title', key: 'title', width: 28 },
        { header: 'Type', key: 'type', width: 18 },
        { header: 'Mentor', key: 'mentor', width: 20 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Meet Link', key: 'meetLink', width: 36 },
        { header: 'Mentees', key: 'mentees', width: 36 },
        { header: 'Agenda', key: 'agenda', width: 36 },
      ],
      rows: meetingRows,
    },
    {
      sheetName: 'Minutes',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Title', key: 'title', width: 28 },
        { header: 'Type', key: 'type', width: 18 },
        { header: 'Mentor', key: 'mentor', width: 20 },
        { header: 'Finalized', key: 'finalized', width: 10 },
        { header: 'Present', key: 'present', width: 10 },
        { header: 'Attendees', key: 'attendees', width: 10 },
        { header: 'Agenda', key: 'agenda', width: 30 },
        { header: 'Discussion', key: 'discussion', width: 40 },
        { header: 'Decisions', key: 'decisions', width: 30 },
        { header: 'Action Items', key: 'actionItems', width: 36 },
      ],
      rows: minutesRows,
    },
    {
      sheetName: 'Branch Changes',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Student', key: 'student', width: 22 },
        { header: 'Reg. No', key: 'regNo', width: 16 },
        { header: 'From', key: 'from', width: 18 },
        { header: 'To', key: 'to', width: 18 },
        { header: 'Reason', key: 'reason', width: 36 },
        { header: 'CGPA', key: 'cgpa', width: 8 },
        { header: 'Mentor', key: 'mentor', width: 20 },
        { header: 'Mentor Remarks', key: 'mentorRemarks', width: 36 },
        { header: 'Recommends', key: 'mentorRecommends', width: 12 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Decision Remarks', key: 'decisionRemarks', width: 30 },
        { header: 'Decided On', key: 'decidedOn', width: 12 },
      ],
      rows: branchRows,
    },
    {
      sheetName: 'Gradesheets',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Student', key: 'student', width: 22 },
        { header: 'Reg. No', key: 'regNo', width: 16 },
        { header: 'Title', key: 'title', width: 24 },
        { header: 'Semester', key: 'semester', width: 10 },
        { header: 'Credits Earned', key: 'creditsEarned', width: 14 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Courses', key: 'courses', width: 10 },
        { header: 'Verified On', key: 'verifiedOn', width: 12 },
      ],
      rows: gsRows,
    },
  ]);

  const fname = `CUTM-Mentor-Interactions-${studentId ? 'student-' : ''}${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
