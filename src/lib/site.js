/**
 * Public site identity for SEO, Open Graph, emails, and absolute URLs.
 * Prefer APP_URL from env (same as emails / Meet callbacks).
 */
export function getSiteUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export const SITE = {
  name: 'CUTM Mentoring',
  shortName: 'CUTM Mentoring',
  appName: 'CUTM Mentor–Mentee Platform',
  org: 'Centurion University of Technology and Management',
  orgShort: 'Centurion University',
  description:
    'Mentor–mentee platform for Centurion University. Track CBCS credits, counselling, meetings and minutes, and print NAAC, NIRF, and NBA-ready reports.',
  keywords: [
    'CUTM',
    'Centurion University',
    'mentor mentee',
    'mentoring platform',
    'CBCS credits',
    'NAAC',
    'NIRF',
    'NBA',
    'counselling',
    'gradesheet',
    'IQAC',
  ],
};
