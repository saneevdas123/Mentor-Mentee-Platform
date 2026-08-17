import path from 'path';
import nodemailer from 'nodemailer';
import { EMAIL_LOGO_CID } from '@/lib/emailTemplates';

export { weeklyMeetingEmail, parentMeetingEmail, credentialsEmail, gradesheetRequestEmail } from '@/lib/emailTemplates';

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

function logoAttachment() {
  return {
    filename: 'cutm-logo.png',
    path: path.join(process.cwd(), 'public', 'cutm-logo.png'),
    cid: EMAIL_LOGO_CID,
    contentDisposition: 'inline',
  };
}

/**
 * Send a single email. If SMTP is not configured the payload is logged so the
 * platform keeps working in development (fail-soft).
 * CUTM logo is attached inline so the header mark shows even without a public URL.
 */
export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  const from = process.env.MAIL_FROM || 'CUTM Mentoring <no-reply@cutm.ac.in>';
  if (!t) {
    console.log(`[mailer:dryrun] TO=${to} SUBJECT=${subject}`);
    return { accepted: Array.isArray(to) ? to : [to], dryRun: true };
  }
  const payload = { from, to, subject, html, text };
  const wantsLogo = html?.includes(`cid:${EMAIL_LOGO_CID}`);
  try {
    return await t.sendMail({
      ...payload,
      attachments: wantsLogo ? [logoAttachment()] : undefined,
    });
  } catch (e) {
    if (wantsLogo) {
      console.warn('[mailer] send with logo failed, retrying without attachment:', e.message);
      return t.sendMail(payload);
    }
    throw e;
  }
}
