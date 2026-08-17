import { format } from 'date-fns';
import { ROLE_LABELS, ROLE_HOME } from '@/lib/rbac';
import { getSiteUrl, SITE } from '@/lib/site';

export const EMAIL_LOGO_CID = 'cutm-logo@cutm';

const INK = '#141414';
const CREAM = '#FDF8F0';
const BRAND = '#FF4B3E';
const MUTED = '#5c574e';

const ROLE_BLURB = {
  ADMIN: 'You can set up schools, add deans, and open campus reports (NAAC, NIRF, NBA).',
  DEAN: 'You can add heads of department for your school and follow mentoring across those departments.',
  HOD: 'You can add faculty mentors and students in your department, and assign mentees.',
  MENTOR: 'You can see your mentees, run meetings, and follow their credits and counselling.',
  STUDENT: 'You can see your mentor, credits, meetings, and raise an issue if you need help.',
};

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function httpUrl(value) {
  const raw = String(value || '').trim();
  if (!/^https?:\/\//i.test(raw)) return '';
  return raw;
}

function whenLine(date) {
  try {
    return format(new Date(date), 'EEEE, d MMM yyyy · h:mm a');
  } catch {
    return '';
  }
}

function shortWhen(date) {
  try {
    return format(new Date(date), 'd MMM · h:mm a');
  } catch {
    return '';
  }
}

function dashboardUrl(role) {
  const home = ROLE_HOME[role] || '/';
  return `${getSiteUrl()}${home}`;
}

function logoSrc() {
  const site = getSiteUrl();
  if (/^https:\/\//i.test(site) && !/localhost/i.test(site)) {
    return `${site}/cutm-logo.png`;
  }
  return `cid:${EMAIL_LOGO_CID}`;
}

function metaRow(label, valueHtml) {
  if (!valueHtml) return '';
  return `
    <tr>
      <td class="email-meta-label" style="padding:10px 0;border-bottom:1px solid rgba(20,20,20,0.08);width:34%;vertical-align:top;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED};">
        ${esc(label)}
      </td>
      <td class="email-meta-value" style="padding:10px 0;border-bottom:1px solid rgba(20,20,20,0.08);vertical-align:top;font-size:15px;line-height:1.45;color:${INK};font-weight:600;">
        ${valueHtml}
      </td>
    </tr>`;
}

function ctaButton(href, label) {
  const url = httpUrl(href);
  if (!url) return '';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-btn-wrap" style="margin:0 0 8px 0;">
      <tr>
        <td bgcolor="${BRAND}" class="email-btn-td" style="background:${BRAND};border:2px solid ${INK};border-radius:999px;">
          <a href="${esc(url)}" class="email-btn" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px;">
            ${esc(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function ghostLink(href, label) {
  const url = httpUrl(href);
  if (!url) return '';
  return `<a href="${esc(url)}" style="color:${BRAND};font-weight:700;text-decoration:none;word-break:break-all;">${esc(label)}</a>`;
}

/**
 * Shared CUTM Mentoring letter — cream page, ink frame, official logo.
 * Table layout + a small media query so phones, tablets, and laptops stay readable.
 */
function brandedEmail({ preheader, eyebrow, heading, bodyHtml }) {
  const site = getSiteUrl();
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(heading)}</title>
  <style>
    html, body { margin: 0 !important; padding: 0 !important; }
    body { background: ${CREAM}; }
    a { color: ${BRAND}; }
    img { border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding: 22px 18px !important; }
      .email-head { padding: 18px 18px 16px !important; }
      .email-title { font-size: 22px !important; line-height: 1.25 !important; }
      .email-btn-wrap, .email-btn-td, .email-btn { width: 100% !important; }
      .email-btn { text-align: center !important; box-sizing: border-box !important; }
      .email-logo { width: 40px !important; height: auto !important; }
      .email-meta-label, .email-meta-value {
        display: block !important;
        width: 100% !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .email-meta-label { padding-bottom: 2px !important; border-bottom: 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${esc(preheader)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${CREAM};">
    <tr>
      <td align="center" style="padding:20px 12px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-shell" style="width:600px;max-width:600px;background:#ffffff;border:2px solid ${INK};">
          <tr>
            <td class="email-head" bgcolor="${INK}" style="background:${INK};padding:20px 24px 18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="56" valign="middle" style="width:56px;padding-right:12px;">
                    <div style="background:${CREAM};border:1px solid rgba(253,248,240,0.28);padding:6px;">
                      <img src="${logoSrc()}" class="email-logo" width="44" alt="Centurion University" style="display:block;width:44px;height:auto;" />
                    </div>
                  </td>
                  <td valign="middle">
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND};">
                      CUTM
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;line-height:1.2;color:${CREAM};padding-top:2px;">
                      ${esc(SITE.name)}
                    </div>
                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.35;color:rgba(253,248,240,0.72);padding-top:3px;">
                      ${esc(SITE.orgShort)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td height="4" bgcolor="${BRAND}" style="background:${BRAND};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;color:${INK};">
              ${eyebrow ? `<div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND};margin:0 0 8px;">${esc(eyebrow)}</div>` : ''}
              <h1 class="email-title" style="margin:0 0 18px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${INK};">
                ${esc(heading)}
              </h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:8px 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:${MUTED};">
              Mentoring Cell<br />
              ${esc(SITE.org)}
            </td>
          </tr>
          <tr>
            <td class="email-pad" bgcolor="${CREAM}" style="background:${CREAM};padding:16px 28px 18px;border-top:2px solid ${INK};font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:12px;line-height:1.5;color:${MUTED};">
                Automated mail from ${esc(SITE.appName)}. Please do not reply to this address.
              </div>
              <div style="font-size:12px;line-height:1.5;color:${MUTED};padding-top:6px;">
                <a href="${esc(site)}" style="color:${INK};font-weight:700;text-decoration:none;">${esc(site.replace(/^https?:\/\//, ''))}</a>
                &nbsp;·&nbsp;© ${year} CUTM
              </div>
              <div style="font-size:11px;font-style:italic;color:${MUTED};padding-top:8px;">
                Shaping Lives · Empowering Communities
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function p(html) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${INK};">${html}</p>`;
}

function note(html) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 18px;">
      <tr>
        <td style="background:${CREAM};border:1px solid rgba(20,20,20,0.12);padding:12px 14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:${INK};">
          ${html}
        </td>
      </tr>
    </table>`;
}

function detailsTable(rows) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 20px;">
      ${rows}
    </table>`;
}

export function weeklyMeetingEmail({ recipientName, meeting, audience = 'student' }) {
  const name = recipientName || (audience === 'mentor' ? 'Mentor' : 'Student');
  const when = whenLine(meeting.scheduledAt);
  const meet = httpUrl(meeting.meetLink);
  const title = meeting.title || 'Weekly mentoring meeting';
  const agenda = meeting.agenda || 'Academic progress, difficulties, and guidance';
  const mins = meeting.durationMins || 45;
  const dash = audience === 'mentor' ? dashboardUrl('MENTOR') : dashboardUrl('STUDENT');

  const lead = audience === 'mentor'
    ? 'A mentoring session with your mentees is on the calendar.'
    : 'Your mentoring session is on the calendar.';

  const bodyHtml = [
    p(`Hello ${esc(name)},`),
    p(lead),
    detailsTable([
      metaRow('When', esc(when)),
      metaRow('Session', esc(title)),
      metaRow('Length', `${esc(mins)} minutes`),
      metaRow('Agenda', esc(agenda)),
      meet ? metaRow('Meet', ghostLink(meet, meet)) : '',
    ].join('')),
    ctaButton(meet, 'Join Google Meet'),
    meet ? '' : note('A Meet link was not attached. Check your dashboard closer to the time.'),
    p(`If the button does not open, use the link above or open <a href="${esc(dash)}" style="color:${BRAND};font-weight:700;text-decoration:none;">your dashboard</a>.`),
    p('Please join on time.'),
  ].join('');

  const text = [
    `Hello ${name},`,
    '',
    lead,
    `When: ${when}`,
    `Session: ${title}`,
    `Length: ${mins} minutes`,
    `Agenda: ${agenda}`,
    meet ? `Join: ${meet}` : '',
    `Dashboard: ${dash}`,
    '',
    'Mentoring Cell, Centurion University',
  ].filter(Boolean).join('\n');

  return {
    subject: `Mentoring meeting · ${shortWhen(meeting.scheduledAt)}`,
    html: brandedEmail({
      preheader: `${when} · ${agenda}`,
      eyebrow: 'Mentoring meeting',
      heading: audience === 'mentor' ? 'Session with your mentees' : 'Your mentoring session',
      bodyHtml,
    }),
    text,
  };
}

export function parentMeetingEmail({ recipientName, meeting, audience = 'parent' }) {
  const when = whenLine(meeting.scheduledAt);
  const meet = httpUrl(meeting.meetLink);
  const title = meeting.title || 'Monthly parent–mentor meeting';
  const agenda = meeting.agenda || 'Academic performance, attendance, placements, and mentoring feedback';
  const mins = meeting.durationMins || 60;
  const ward = recipientName || 'your ward';

  const isMentor = audience === 'mentor';
  const greeting = isMentor ? `Hello ${esc(recipientName || 'Mentor')},` : `Dear Parent / Guardian of ${esc(ward)},`;
  const lead = isMentor
    ? 'A parent–mentor meeting is scheduled for your mentees.'
    : 'You are invited to this month\'s parent-mentor meeting to review academic progress.';
  const heading = isMentor ? 'Parent meeting for your mentees' : 'Parent–mentor meeting';

  const bodyHtml = [
    p(greeting),
    p(lead),
    detailsTable([
      metaRow('When', esc(when)),
      metaRow('Session', esc(title)),
      metaRow('Length', `${esc(mins)} minutes`),
      metaRow('Agenda', esc(agenda)),
      meet ? metaRow('Meet', ghostLink(meet, meet)) : '',
    ].join('')),
    ctaButton(meet, 'Join Google Meet'),
    p(isMentor
      ? `Details also sit on <a href="${esc(dashboardUrl('MENTOR'))}" style="color:${BRAND};font-weight:700;text-decoration:none;">your mentor dashboard</a>.`
      : 'If you cannot join, please write to the faculty mentor or the department office.'),
  ].join('');

  const text = [
    isMentor ? `Hello ${recipientName || 'Mentor'},` : `Dear Parent / Guardian of ${ward},`,
    '',
    isMentor ? 'A parent-mentor meeting is scheduled for your mentees.' : 'You are invited to this month\'s parent-mentor meeting.',
    `When: ${when}`,
    `Session: ${title}`,
    `Agenda: ${agenda}`,
    meet ? `Join: ${meet}` : '',
    '',
    'Mentoring Cell, Centurion University',
  ].filter(Boolean).join('\n');

  return {
    subject: `Parent meeting · ${shortWhen(meeting.scheduledAt)}`,
    html: brandedEmail({
      preheader: `${when} · ${agenda}`,
      eyebrow: 'Parent meeting',
      heading,
      bodyHtml,
    }),
    text,
  };
}

export function credentialsEmail({ name, email, tempPassword, role, loginUrl }) {
  const roleLabel = ROLE_LABELS[role] || role || 'Member';
  const blurb = ROLE_BLURB[role] || 'Sign in to the CUTM Mentoring platform with the details below.';
  const login = httpUrl(loginUrl) || `${getSiteUrl()}/login`;

  const bodyHtml = [
    p(`Hello ${esc(name || 'there')},`),
    p(`An account is ready for you as <strong>${esc(roleLabel)}</strong>. ${esc(blurb)}`),
    detailsTable([
      metaRow('Sign-in', ghostLink(login, login)),
      metaRow('Email', esc(email)),
    ].join('')),
    `<div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};margin:0 0 8px;">Temporary password</div>`,
    `<div style="font-family:Consolas,'Courier New',monospace;font-size:18px;font-weight:700;letter-spacing:0.04em;color:${INK};background:${CREAM};border:2px solid ${INK};padding:12px 14px;margin:0 0 16px;word-break:break-all;">${esc(tempPassword)}</div>`,
    note('On first sign-in you will be asked to choose your own password. Do not share this mail.'),
    ctaButton(login, 'Open sign-in'),
  ].join('');

  const text = [
    `Hello ${name || 'there'},`,
    '',
    `An account is ready for you as ${roleLabel}.`,
    blurb,
    '',
    `Sign-in: ${login}`,
    `Email: ${email}`,
    `Temporary password: ${tempPassword}`,
    '',
    'Change this password on first sign-in. Do not share this mail.',
    '',
    'Mentoring Cell, Centurion University',
  ].join('\n');

  return {
    subject: `CUTM Mentoring — ${roleLabel} sign-in`,
    html: brandedEmail({
      preheader: `Sign in as ${roleLabel}. Change the temporary password on first login.`,
      eyebrow: 'Account',
      heading: 'Your sign-in details',
      bodyHtml,
    }),
    text,
  };
}

export function gradesheetRequestEmail({ studentName, mentorName, dashboardUrl }) {
  const dash = httpUrl(dashboardUrl) || `${getSiteUrl()}/student`;
  const mentor = mentorName || 'Your faculty mentor';

  const bodyHtml = [
    p(`Hello ${esc(studentName || 'there')},`),
    p(`<strong>${esc(mentor)}</strong> has asked you to upload your latest semester gradesheet so your credit tracker can be updated.`),
    detailsTable([
      metaRow('From', esc(mentor)),
      metaRow('What to do', 'Sign in and upload a text PDF (not a photo scan).'),
    ].join('')),
    note('Use a clear text PDF from the exam cell. Photo scans cannot be read. Your mentor reviews the basket mapping before credits count.'),
    ctaButton(dash, 'Open your dashboard'),
    p('If the button does not open, sign in at the usual CUTM Mentoring address and go to Academics.'),
  ].join('');

  const text = [
    `Hello ${studentName || 'there'},`,
    '',
    `${mentor} has asked you to upload your latest semester gradesheet.`,
    '',
    `Open: ${dash}`,
    '',
    'Use a text PDF, not a photo scan. Your mentor will review it before credits count.',
    '',
    'Mentoring Cell, Centurion University',
  ].join('\n');

  return {
    subject: 'CUTM Mentoring — please upload your gradesheet',
    html: brandedEmail({
      preheader: `${mentor} asked you to upload your latest gradesheet.`,
      eyebrow: 'Gradesheet',
      heading: 'Please upload your gradesheet',
      bodyHtml,
    }),
    text,
  };
}
