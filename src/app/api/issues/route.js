import dbConnect from '@/lib/db';
import Issue from '@/models/Issue';
import StudentProfile from '@/models/StudentProfile';
import Mapping from '@/models/Mapping';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { sendMail, newSupportTicketEmail } from '@/lib/mailer';
import { getSiteUrl } from '@/lib/site';

export async function GET(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const filter = {};
  if (session.role === 'DEAN') filter.school = session.school;
  if (session.role === 'HOD') filter.department = session.department;
  if (session.role === 'MENTOR') filter.mentor = session.sub;
  if (session.role === 'STUDENT') {
    const sp = await StudentProfile.findOne({ user: session.sub });
    filter.student = sp?._id;
  }
  const issues = await Issue.find(filter)
    .populate('student', 'name registrationNo').populate('mentor', 'name email')
    .sort({ createdAt: -1 }).lean();
  return json({ issues });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const body = await req.json();

  let studentId = body.student;
  let mentorId = null, dept = null, school = null;
  let studentName = session.name;

  if (session.role === 'STUDENT') {
    const sp = await StudentProfile.findOne({ user: session.sub });
    if (!sp) return error('Student profile not found.', 404);
    studentId = sp._id;
    studentName = sp.name || session.name;
    dept = sp.department; school = sp.school;
    const map = await Mapping.findOne({ student: sp._id, active: true });
    mentorId = map?.mentor || null;
  } else {
    const sp = await StudentProfile.findById(studentId);
    if (sp) {
      studentName = sp.name || session.name;
      dept = sp.department;
      school = sp.school;
      const map = await Mapping.findOne({ student: sp._id, active: true });
      mentorId = map?.mentor;
    }
  }

  if (!body.subject || !body.description) return error('Subject and description are required.');

  const issue = await Issue.create({
    student: studentId,
    raisedBy: session.sub,
    mentor: mentorId,
    department: dept,
    school,
    ticketType: 'SUPPORT',
    category: body.category || 'ACADEMIC',
    priority: body.priority || 'MEDIUM',
    subject: body.subject,
    description: body.description,
    status: 'OPEN',
  });

  const ticketNo = `SUP-${String(issue._id).slice(-6).toUpperCase()}`;
  issue.ticketNo = ticketNo;
  await issue.save();

  let emailed = false;
  if (mentorId) {
    const mentor = await User.findById(mentorId).select('name email').lean();
    const to = String(mentor?.email || '').trim();
    if (to) {
      const { subject, html, text } = newSupportTicketEmail({
        mentorName: mentor.name,
        studentName: studentName || session.name,
        ticketNo,
        subject: issue.subject,
        category: issue.category,
        priority: issue.priority,
        description: issue.description,
        dashboardUrl: `${getSiteUrl()}/mentor`,
      });
      try {
        const sent = await sendMail({ to, subject, html, text });
        emailed = !sent?.dryRun;
      } catch (e) {
        console.warn('[issues] mentor notify failed:', e.message);
      }
    }
  }

  return json({ ok: true, issue, emailed, ticketNo }, 201);
}
