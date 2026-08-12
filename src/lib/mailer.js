import nodemailer from 'nodemailer';
import { format } from 'date-fns';

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn('[mailer] SMTP not configured — emails will be logged, not sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Send a single email. If SMTP is not configured the payload is logged so the
 * platform keeps working in development (fail-soft).
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  const from = process.env.MAIL_FROM || 'CUTM Mentoring <no-reply@cutm.ac.in>';
  if (!t) {
    console.log(`[mailer:dryrun] TO=${to} SUBJECT=${subject}`);
    return { accepted: Array.isArray(to) ? to : [to], dryRun: true };
  }
  return t.sendMail({ from, to, subject, html, text });
}

// ---- Templates -------------------------------------------------------------

const shell = (title, inner) => `
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:#FF4B3E;color:#fff;padding:18px 24px">
    <h2 style="margin:0;font-size:18px">Centurion University of Technology and Management</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:.85">Mentor–Mentee Programme · ${title}</p>
  </div>
  <div style="padding:24px;color:#111827;font-size:14px;line-height:1.6">${inner}</div>
  <div style="background:#f9fafb;padding:14px 24px;color:#6b7280;font-size:12px">
    This is an automated message from the CUTM Mentor-Mentee Platform. Please do not reply.
  </div>
</div>`;

export function weeklyMeetingEmail({ recipientName, meeting }) {
  const when = format(new Date(meeting.scheduledAt), 'EEEE, dd MMM yyyy · hh:mm a');
  const inner = `
    <p>Dear ${recipientName || 'Participant'},</p>
    <p>Your <b>weekly mentor-mentee meeting</b> has been scheduled.</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:6px 0;color:#6b7280">Date &amp; Time</td><td><b>${when}</b></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Agenda</td><td>${meeting.agenda || 'Academic progress, difficulties and guidance'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Join link</td><td><a href="${meeting.meetLink}" style="color:#FF4B3E">${meeting.meetLink}</a></td></tr>
    </table>
    <p>
      <a href="${meeting.meetLink}" style="display:inline-block;background:#FF4B3E;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">Join Google Meet</a>
    </p>
    <p>Kindly be present on time. Regards,<br/>Mentoring Cell, CUTM</p>`;
  return { subject: `Weekly Mentoring Meeting · ${when}`, html: shell('Weekly Meeting', inner) };
}

export function parentMeetingEmail({ recipientName, meeting }) {
  const when = format(new Date(meeting.scheduledAt), 'EEEE, dd MMM yyyy · hh:mm a');
  const inner = `
    <p>Respected Parent / Guardian ${recipientName ? `of ${recipientName}` : ''},</p>
    <p>You are cordially invited to the <b>monthly parent–mentor meeting</b> to review your ward's academic progress and overall development.</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:6px 0;color:#6b7280">Date &amp; Time</td><td><b>${when}</b></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Agenda</td><td>${meeting.agenda || 'Academic performance, attendance, placements and mentoring feedback'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Join link</td><td><a href="${meeting.meetLink}" style="color:#FF4B3E">${meeting.meetLink}</a></td></tr>
    </table>
    <p><a href="${meeting.meetLink}" style="display:inline-block;background:#FF4B3E;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">Join Google Meet</a></p>
    <p>Your participation is valuable to us. Regards,<br/>Mentoring Cell, CUTM</p>`;
  return { subject: `Monthly Parent Meeting · ${when}`, html: shell('Parent Meeting', inner) };
}

export function credentialsEmail({ name, email, tempPassword, role, loginUrl }) {
  const inner = `
    <p>Dear ${name},</p>
    <p>An account has been created for you on the CUTM Mentor-Mentee Platform with the role <b>${role}</b>.</p>
    <table style="width:100%;border-collapse:collapse;margin:12px 0">
      <tr><td style="padding:6px 0;color:#6b7280">Login URL</td><td><a href="${loginUrl}">${loginUrl}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Username</td><td><b>${email}</b></td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Temporary password</td><td><b>${tempPassword}</b></td></tr>
    </table>
    <p>For security, you will be asked to change this password on first login.</p>
    <p>Regards,<br/>Mentoring Cell, CUTM</p>`;
  return { subject: 'Your CUTM Mentor-Mentee Platform credentials', html: shell('Access Credentials', inner) };
}
