import dbConnect from '@/lib/db';
import Meeting from '@/models/Meeting';
import Mapping from '@/models/Mapping';
import StudentProfile from '@/models/StudentProfile';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { json, error } from '@/lib/apiGuard';
import { createMeetEvent } from '@/lib/googleMeet';
import { autoGenerateMinutes } from '@/lib/minutes';
import { sendMail, weeklyMeetingEmail, parentMeetingEmail } from '@/lib/mailer';

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
    const maps = await Mapping.find({ student: sp?._id, active: true }).select('mentor').lean();
    filter.mentor = { $in: maps.map((m) => m.mentor) };
  }
  const meetings = await Meeting.find(filter).populate('mentor', 'name email').sort({ scheduledAt: -1 }).limit(200).lean();
  return json({ meetings });
}

// Ad-hoc meeting creation by a mentor (with notification + minutes).
export async function POST(req) {
  const session = await getSession();
  if (!session) return error('Unauthorized', 401);
  if (!['MENTOR', 'HOD', 'ADMIN', 'DEAN'].includes(session.role)) return error('Forbidden', 403);
  await dbConnect();
  const body = await req.json();
  const { title, type, scheduledAt, agenda, durationMins } = body;
  if (!scheduledAt) return error('scheduledAt is required.');

  const mentorId = session.role === 'MENTOR' ? session.sub : body.mentor;
  const mentor = await User.findById(mentorId);
  const maps = await Mapping.find({ mentor: mentorId, active: true }).populate('student').lean();
  const mentees = maps.map((m) => m.student).filter(Boolean);
  const isParent = type === 'MONTHLY_PARENT';
  const recipientEmails = isParent ? mentees.map((s) => s.parentEmail).filter(Boolean) : mentees.map((s) => s.email).filter(Boolean);

  const ev = await createMeetEvent({
    summary: title || (isParent ? 'Parent Meeting' : 'Mentoring Meeting'),
    description: agenda || '',
    startISO: new Date(scheduledAt).toISOString(),
    durationMins: durationMins || (isParent ? 60 : 45),
    attendees: [mentor?.email, ...recipientEmails].filter(Boolean),
  });

  const meeting = await Meeting.create({
    title: title || (isParent ? 'Parent Meeting' : 'Mentoring Meeting'),
    type: type || 'ADHOC', mentor: mentorId, department: mentor?.department, school: mentor?.school,
    scheduledAt: new Date(scheduledAt), durationMins: durationMins || 45,
    meetLink: ev.meetLink, calendarEventId: ev.calendarEventId,
    menteeEmails: mentees.map((s) => s.email).filter(Boolean),
    parentEmails: mentees.map((s) => s.parentEmail).filter(Boolean),
    agenda, status: 'SCHEDULED', createdBy: session.sub,
  });

  // Notify.
  const tmpl = isParent ? parentMeetingEmail : weeklyMeetingEmail;
  const targets = isParent
    ? mentees.map((s) => ({ email: s.parentEmail, name: s.name }))
    : [{ email: mentor?.email, name: mentor?.name }, ...mentees.map((s) => ({ email: s.email, name: s.name }))];
  for (const t of targets) {
    if (!t.email) continue;
    const audience = isParent ? 'parent' : (t.email === mentor?.email ? 'mentor' : 'student');
    const { subject, html, text } = tmpl({ recipientName: t.name, meeting, audience });
    try { await sendMail({ to: t.email, subject, html, text }); } catch {}
  }
  meeting.status = 'NOTIFIED'; meeting.notificationSentAt = new Date(); await meeting.save();

  const attendees = [
    { name: mentor?.name, role: 'MENTOR', email: mentor?.email, present: false },
    ...mentees.map((s) => ({ name: isParent ? `Parent of ${s.name}` : s.name, role: isParent ? 'PARENT' : 'STUDENT', email: isParent ? s.parentEmail : s.email, present: false })),
  ];
  await autoGenerateMinutes(meeting, { attendees });

  return json({ ok: true, meeting }, 201);
}
