import { google } from 'googleapis';

/**
 * Create a Google Calendar event WITH a Google Meet conference link.
 *
 * Preferred path: a Google Cloud service account with Domain-Wide Delegation
 * impersonating a Workspace user (GOOGLE_IMPERSONATE). This produces a real,
 * unique Meet link and a calendar invite.
 *
 * Fallback: if Google credentials are not configured, we return a deterministic
 * Meet room URL so the rest of the platform keeps functioning in development.
 */
export async function createMeetEvent({ summary, description, startISO, durationMins = 45, attendees = [] }) {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const impersonate = process.env.GOOGLE_IMPERSONATE;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMins * 60000);

  if (!clientEmail || !privateKey || !impersonate) {
    // Fallback: static Meet room (works, but not auto-provisioned on Calendar).
    const room = `cutm-${Buffer.from(summary + startISO).toString('hex').slice(0, 10)}`;
    return {
      meetLink: `https://meet.google.com/lookup/${room}`,
      calendarEventId: null,
      fallback: true,
    };
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
    subject: impersonate,
  });

  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary,
      description,
      start: { dateTime: start.toISOString(), timeZone: process.env.SCHEDULE_TZ || 'Asia/Kolkata' },
      end: { dateTime: end.toISOString(), timeZone: process.env.SCHEDULE_TZ || 'Asia/Kolkata' },
      attendees: attendees.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `cutm-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    },
  });

  const meetLink =
    res.data.hangoutLink ||
    res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;

  return { meetLink, calendarEventId: res.data.id, fallback: false };
}
