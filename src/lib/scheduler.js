import dbConnect from '@/lib/db';
import User from '@/models/User';
import Mapping from '@/models/Mapping';
import StudentProfile from '@/models/StudentProfile';
import Meeting from '@/models/Meeting';
import Announcement from '@/models/Announcement';
import { createMeetEvent } from '@/lib/googleMeet';
import { autoGenerateMinutes } from '@/lib/minutes';
import { sendMail, weeklyMeetingEmail, parentMeetingEmail } from '@/lib/mailer';

function nextOccurrence(day, timeStr) {
  // day: 0-6 (Sun-Sat), timeStr "HH:MM" — next future occurrence.
  const [h, m] = (timeStr || '10:00').split(':').map((x) => parseInt(x, 10));
  const now = new Date();
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  const diff = (day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  if (d <= now) d.setDate(d.getDate() + 7);
  return d;
}

function nextMonthly(dom, timeStr) {
  const [h, m] = (timeStr || '11:00').split(':').map((x) => parseInt(x, 10));
  const now = new Date();
  let d = new Date(now.getFullYear(), now.getMonth(), dom, h, m, 0, 0);
  if (d <= now) d = new Date(now.getFullYear(), now.getMonth() + 1, dom, h, m, 0, 0);
  return d;
}

async function menteesForMentor(mentorId) {
  const maps = await Mapping.find({ mentor: mentorId, active: true }).populate('student');
  return maps.map((x) => x.student).filter(Boolean);
}

/**
 * Weekly mentoring run: for every active mentor create a meeting (if none exists
 * for the target slot), generate a Meet link, email mentor + mentees, and create
 * the minutes skeleton.
 */
export async function runWeeklyMentoring({ dryRun = false } = {}) {
  await dbConnect();
  const day = parseInt(process.env.WEEKLY_MEETING_DAY || '1', 10);
  const time = process.env.WEEKLY_MEETING_TIME || '10:00';
  const slot = nextOccurrence(day, time);

  const mentors = await User.find({ role: 'MENTOR', isActive: true });
  const results = [];

  for (const mentor of mentors) {
    const mentees = await menteesForMentor(mentor._id);
    if (mentees.length === 0) continue;

    // Skip if a weekly meeting already scheduled within 6 days of this slot.
    const dup = await Meeting.findOne({
      mentor: mentor._id,
      type: 'WEEKLY_MENTORING',
      scheduledAt: { $gte: new Date(slot.getTime() - 6 * 864e5), $lte: new Date(slot.getTime() + 864e5) },
    });
    if (dup) continue;

    const menteeEmails = mentees.map((s) => s.email).filter(Boolean);
    const title = `Weekly Mentoring — ${mentor.name}`;

    let meetLink = `https://meet.google.com/lookup/cutm-${String(mentor._id).slice(-6)}`;
    let calendarEventId = null;
    if (!dryRun) {
      const ev = await createMeetEvent({
        summary: title,
        description: 'Weekly mentor-mentee interaction.',
        startISO: slot.toISOString(),
        durationMins: 45,
        attendees: [mentor.email, ...menteeEmails].filter(Boolean),
      });
      meetLink = ev.meetLink;
      calendarEventId = ev.calendarEventId;
    }

    const meeting = await Meeting.create({
      title,
      type: 'WEEKLY_MENTORING',
      mentor: mentor._id,
      department: mentor.department,
      school: mentor.school,
      scheduledAt: slot,
      durationMins: 45,
      meetLink,
      calendarEventId,
      menteeEmails,
      agenda: 'Academic progress, difficulties and guidance',
      status: 'SCHEDULED',
      createdBy: mentor._id,
    });

    // Notify mentor + mentees.
    const recipients = [{ email: mentor.email, name: mentor.name }, ...mentees.map((s) => ({ email: s.email, name: s.name }))];
    let sent = 0, failed = 0;
    for (const r of recipients) {
      if (!r.email) continue;
      const audience = r.email === mentor.email ? 'mentor' : 'student';
      const { subject, html, text } = weeklyMeetingEmail({ recipientName: r.name, meeting, audience });
      try {
        if (!dryRun) await sendMail({ to: r.email, subject, html, text });
        sent++;
      } catch (e) {
        failed++;
      }
    }

    meeting.status = 'NOTIFIED';
    meeting.notificationSentAt = new Date();
    await meeting.save();

    await Announcement.create({
      subject: `Weekly Mentoring Meeting — ${mentor.name}`,
      body: 'Automated weekly meeting notification.',
      audience: 'ALL',
      relatedMeeting: meeting._id,
      recipients: recipients.map((r) => r.email).filter(Boolean),
      sentCount: sent,
      failedCount: failed,
      status: failed ? 'PARTIAL' : 'SENT',
      triggeredBy: 'SCHEDULER',
    });

    // Minutes skeleton.
    const attendees = [
      { name: mentor.name, role: 'MENTOR', email: mentor.email, present: false },
      ...mentees.map((s) => ({ name: s.name, role: 'STUDENT', email: s.email, present: false })),
    ];
    await autoGenerateMinutes(meeting, { attendees });

    results.push({ mentor: mentor.email, mentees: mentees.length, sent, failed });
  }

  return { slot, mentorsProcessed: results.length, results };
}

/**
 * Monthly parent meeting run: one meeting per mentor, invite parents of mentees.
 */
export async function runMonthlyParent({ dryRun = false } = {}) {
  await dbConnect();
  const dom = parseInt(process.env.MONTHLY_MEETING_DOM || '1', 10);
  const time = process.env.MONTHLY_MEETING_TIME || '11:00';
  const slot = nextMonthly(dom, time);

  const mentors = await User.find({ role: 'MENTOR', isActive: true });
  const results = [];

  for (const mentor of mentors) {
    const mentees = await menteesForMentor(mentor._id);
    if (mentees.length === 0) continue;

    const dup = await Meeting.findOne({
      mentor: mentor._id,
      type: 'MONTHLY_PARENT',
      scheduledAt: { $gte: new Date(slot.getFullYear(), slot.getMonth(), 1), $lt: new Date(slot.getFullYear(), slot.getMonth() + 1, 1) },
    });
    if (dup) continue;

    const parentEmails = mentees.map((s) => s.parentEmail).filter(Boolean);
    const title = `Monthly Parent Meeting — ${mentor.name}`;

    let meetLink = `https://meet.google.com/lookup/cutm-parent-${String(mentor._id).slice(-6)}`;
    let calendarEventId = null;
    if (!dryRun) {
      const ev = await createMeetEvent({
        summary: title,
        description: 'Monthly parent-mentor interaction.',
        startISO: slot.toISOString(),
        durationMins: 60,
        attendees: [mentor.email, ...parentEmails].filter(Boolean),
      });
      meetLink = ev.meetLink;
      calendarEventId = ev.calendarEventId;
    }

    const meeting = await Meeting.create({
      title,
      type: 'MONTHLY_PARENT',
      mentor: mentor._id,
      department: mentor.department,
      school: mentor.school,
      scheduledAt: slot,
      durationMins: 60,
      meetLink,
      calendarEventId,
      parentEmails,
      agenda: 'Academic performance, attendance, placements and mentoring feedback',
      status: 'SCHEDULED',
      createdBy: mentor._id,
    });

    let sent = 0, failed = 0;
    // Notify mentor once.
    try {
      const { subject, html, text } = parentMeetingEmail({ recipientName: mentor.name, meeting, audience: 'mentor' });
      if (!dryRun) await sendMail({ to: mentor.email, subject, html, text });
      sent++;
    } catch { failed++; }
    // Notify each parent (personalised with ward name).
    for (const s of mentees) {
      if (!s.parentEmail) continue;
      const { subject, html, text } = parentMeetingEmail({ recipientName: s.name, meeting, audience: 'parent' });
      try {
        if (!dryRun) await sendMail({ to: s.parentEmail, subject, html, text });
        sent++;
      } catch { failed++; }
    }

    meeting.status = 'NOTIFIED';
    meeting.notificationSentAt = new Date();
    await meeting.save();

    await Announcement.create({
      subject: `Monthly Parent Meeting — ${mentor.name}`,
      body: 'Automated monthly parent meeting notification.',
      audience: 'PARENTS',
      relatedMeeting: meeting._id,
      recipients: parentEmails,
      sentCount: sent,
      failedCount: failed,
      status: failed ? 'PARTIAL' : 'SENT',
      triggeredBy: 'SCHEDULER',
    });

    const attendees = [
      { name: mentor.name, role: 'MENTOR', email: mentor.email, present: false },
      ...mentees.map((s) => ({ name: `Parent of ${s.name}`, role: 'PARENT', email: s.parentEmail, present: false })),
    ];
    await autoGenerateMinutes(meeting, { attendees });

    results.push({ mentor: mentor.email, parents: parentEmails.length, sent, failed });
  }

  return { slot, mentorsProcessed: results.length, results };
}
