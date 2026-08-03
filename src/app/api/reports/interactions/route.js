import dbConnect from '@/lib/db';
import Counselling from '@/models/Counselling';
import BranchChangeRequest from '@/models/BranchChangeRequest';
import Gradesheet from '@/models/Gradesheet';
import { getSession } from '@/lib/auth';
import { error } from '@/lib/apiGuard';
import { studentIdsInScope, canAccessStudent } from '@/lib/access';
import { buildExport } from '@/lib/excel';

export const dynamic = 'force-dynamic';

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');

  const scope = {};
  if (studentId) {
    if (!(await canAccessStudent(session, studentId))) return error('Forbidden', 403);
    scope.student = studentId;
  } else {
    const ids = await studentIdsInScope(session);
    if (ids) scope.student = { $in: ids };
  }

  const [records, branch, sheets] = await Promise.all([
    Counselling.find(scope).populate('student', 'name registrationNo').populate('mentor', 'name').sort({ occurredOn: -1 }).lean(),
    BranchChangeRequest.find(scope).populate('student', 'name registrationNo').populate('mentor', 'name').sort({ createdAt: -1 }).lean(),
    Gradesheet.find(scope).select('-fileData').populate('student', 'name registrationNo').sort({ createdAt: -1 }).lean(),
  ]);

  const interactionRows = records.map((r) => ({
    date: fmt(r.occurredOn),
    student: r.student?.name,
    regNo: r.student?.registrationNo,
    mentor: r.mentor?.name || '',
    kind: r.kind,
    mode: r.mode,
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
  }));

  const buffer = await buildExport([
    {
      sheetName: 'Interactions',
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Student', key: 'student', width: 22 },
        { header: 'Reg. No', key: 'regNo', width: 16 },
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
      ],
      rows: gsRows,
    },
  ]);

  const fname = `CUTM-Interactions-${studentId ? 'student-' : ''}${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
