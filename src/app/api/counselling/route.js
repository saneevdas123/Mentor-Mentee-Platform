import dbConnect from '@/lib/db';
import Counselling from '@/models/Counselling';
import StudentProfile from '@/models/StudentProfile';
import Basket from '@/models/Basket';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { canAccessStudent, studentIdsInScope } from '@/lib/access';
import { sendMail, gradesheetRequestEmail } from '@/lib/mailer';
import { getSiteUrl } from '@/lib/site';
import User from '@/models/User';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const kind = searchParams.get('kind');
  const filter = {};
  if (studentId) {
    if (!(await canAccessStudent(session, studentId))) return error('Forbidden', 403);
    filter.student = studentId;
  } else {
    const ids = await studentIdsInScope(session);
    if (ids) filter.student = { $in: ids };
  }
  if (kind) filter.kind = kind;
  const records = await Counselling.find(filter)
    .populate('student', 'name registrationNo')
    .populate('mentor', 'name')
    .sort({ occurredOn: -1 })
    .lean();
  return json({ records });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (session.role === 'STUDENT') return error('Forbidden', 403);
  await dbConnect();
  const b = await req.json();
  if (!b.student) return error('student is required.');
  if (!(await canAccessStudent(session, b.student))) return error('Forbidden', 403);

  const student = await StudentProfile.findById(b.student).select('department school name email').lean();
  if (b.kind === 'GRADESHEET_REQUEST' && !String(student?.email || '').trim()) {
    return error('This student has no email on file, so the request could not be sent.', 400);
  }

  // Denormalise basket names on recommendations.
  let recommendations = Array.isArray(b.recommendations) ? b.recommendations : [];
  if (recommendations.length) {
    const ids = recommendations.map((r) => r.basket).filter(Boolean);
    const baskets = await Basket.find({ _id: { $in: ids } }).select('name').lean();
    const nameById = Object.fromEntries(baskets.map((x) => [String(x._id), x.name]));
    recommendations = recommendations.map((r) => ({
      basket: r.basket || undefined,
      basketName: r.basketName || nameById[String(r.basket)],
      credits: Number(r.credits) || undefined,
      suggestedCourses: r.suggestedCourses,
      targetSemester: Number(r.targetSemester) || undefined,
    }));
  }

  const rec = await Counselling.create({
    student: b.student,
    mentor: session.role === 'MENTOR' ? session.sub : b.mentor,
    department: student?.department,
    school: student?.school,
    kind: b.kind || 'GENERAL',
    mode: b.mode || 'IN_PERSON',
    subject: b.subject,
    summary: b.summary,
    advice: b.advice,
    recommendations,
    followUpOn: b.followUpOn || undefined,
    requestStatus: b.kind === 'GRADESHEET_REQUEST' ? 'OPEN' : undefined,
    relatedBranchChange: b.relatedBranchChange || undefined,
    occurredOn: b.occurredOn || new Date(),
    createdBy: session.sub,
    createdByRole: session.role,
  });

  let emailed = false;
  if (b.kind === 'GRADESHEET_REQUEST') {
    const to = String(student?.email || '').trim();
    const mentor = session.role === 'MENTOR'
      ? await User.findById(session.sub).select('name').lean()
      : null;
    const { subject, html, text } = gradesheetRequestEmail({
      studentName: student.name,
      mentorName: mentor?.name || session.name,
      dashboardUrl: `${getSiteUrl()}/student`,
    });
    try {
      const sent = await sendMail({ to, subject, html, text });
      emailed = !sent?.dryRun;
    } catch (e) {
      console.warn('[counselling] gradesheet request email failed:', e.message);
    }
  }

  return json({ ok: true, record: rec, emailed }, 201);
}
