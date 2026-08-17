import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/rbac';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Sign in',
  description: `Sign in to ${SITE.appName}. Campus accounts are created by your Admin or HoD — there is no public signup.`,
  robots: { index: true, follow: true },
  alternates: { canonical: '/login' },
  openGraph: {
    title: `Sign in · ${SITE.name}`,
    description: `Access mentoring, credits, and campus reports for ${SITE.orgShort}.`,
    url: '/login',
  },
};

export const dynamic = 'force-dynamic';

export default async function LoginLayout({ children }) {
  const session = await getSession();
  if (session?.role) redirect(ROLE_HOME[session.role] || '/');
  return children;
}
