import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/rbac';
import LandingClient from './LandingClient';

export const metadata = {
  title: 'CUTM Mentoring — Mentor–Mentee Platform',
  description:
    'Structured mentoring for Centurion University: credit tracking, counselling, meetings, minutes, and NAAC / NIRF / NBA reports.',
};

export default async function Home() {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role] || '/login');
  return <LandingClient />;
}
