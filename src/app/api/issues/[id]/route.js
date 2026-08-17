import dbConnect from '@/lib/db';
import Issue from '@/models/Issue';
import StudentProfile from '@/models/StudentProfile';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { sendMail, supportTicketUpdateEmail } from '@/lib/mailer';
import { getSiteUrl } from '@/lib/site';

export async function PATCH(req, context) {
  const params = await context.params;
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  await dbConnect();
  const { message, status } = await req.json();
  const issue = await Issue.findById(params.id);
  if (!issue) return error('Issue not found', 404);
  if (message) {
    issue.responses.push({ by: session.sub, byName: session.name, byRole: session.role, message, at: new Date() });
  }
  if (status && ['ADMIN', 'DEAN', 'HOD', 'MENTOR'].includes(session.role)) {
    issue.status = status;
    if (status === 'RESOLVED' || status === 'CLOSED') issue.resolvedAt = new Date();
  }
  if (!issue.ticketNo) {
    issue.ticketNo = `SUP-${String(issue._id).slice(-6).toUpperCase()}`;
  }
  if (!issue.ticketType) issue.ticketType = 'SUPPORT';
  await issue.save();

  let emailed = false;
  const staffUpdate = ['ADMIN', 'DEAN', 'HOD', 'MENTOR'].includes(session.role);
  if (staffUpdate && (message || status)) {
    const student = await StudentProfile.findById(issue.student).select('name email').lean();
    const to = String(student?.email || '').trim();
    if (to) {
      const { subject, html, text } = supportTicketUpdateEmail({
        studentName: student.name,
        mentorName: session.name,
        ticketNo: issue.ticketNo,
        subject: issue.subject,
        status: issue.status,
        message: message || '',
        dashboardUrl: `${getSiteUrl()}/student`,
      });
      try {
        const sent = await sendMail({ to, subject, html, text });
        emailed = !sent?.dryRun;
      } catch (e) {
        console.warn('[issues] student notify failed:', e.message);
      }
    }
  }

  return json({ ok: true, issue, emailed });
}
