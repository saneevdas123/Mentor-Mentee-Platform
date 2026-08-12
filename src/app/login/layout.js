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

export default function LoginLayout({ children }) {
  return children;
}
