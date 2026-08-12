import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/rbac';
import LandingClient from './LandingClient';
import { getSiteUrl, SITE } from '@/lib/site';

export const metadata = {
  title: {
    absolute: `${SITE.name} — Mentor–Mentee Platform | ${SITE.orgShort}`,
  },
  description: SITE.description,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${SITE.name} — Credits, counselling & mentoring for CUTM`,
    description: SITE.description,
    url: '/',
  },
};

function JsonLd() {
  const url = getSiteUrl();
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${url}/#website`,
        url,
        name: SITE.name,
        description: SITE.description,
        publisher: { '@id': `${url}/#organization` },
        inLanguage: 'en-IN',
      },
      {
        '@type': 'WebApplication',
        '@id': `${url}/#app`,
        name: SITE.appName,
        url,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description: SITE.description,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          description: 'Campus accounts are provisioned by Admin / HoD — no public self-signup.',
        },
        provider: { '@id': `${url}/#organization` },
      },
      {
        '@type': 'CollegeOrUniversity',
        '@id': `${url}/#organization`,
        name: SITE.org,
        alternateName: ['CUTM', SITE.orgShort],
        url: 'https://cutm.ac.in',
        logo: `${url}/cutm-logo.png`,
        description: 'Centurion University of Technology and Management',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function Home() {
  const session = await getSession();
  if (session) redirect(ROLE_HOME[session.role] || '/login');
  return (
    <>
      <JsonLd />
      <LandingClient />
    </>
  );
}
