import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { ROLE_LABELS, ROLE_HOME } from '@/lib/rbac';

export default async function ReportsIndex() {
  const session = await getSession();
  const home = ROLE_HOME[session?.role] || '/login';
  const cards = [
    { href: '/reports/naac', title: 'NAAC Report', code: 'NAAC', desc: 'Mentor-mentee ratio, mentoring activity, student progression (Criteria 2 & 5).' },
    { href: '/reports/nirf', title: 'NIRF Report', code: 'NIRF', desc: 'Graduation Outcomes — placement %, higher studies, median salary.' },
    { href: '/reports/nba', title: 'NBA Report', code: 'NBA', desc: 'OBE — CGPA distribution, PO/CO attainment, at-risk intervention.' },
  ];
  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="max-w-4xl mx-auto animate-fade-up">
        <div className="mb-2">
          <Link href={home} className="text-sm text-brand hover:underline">← Back to dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Accreditation Reports</h1>
        <p className="text-gray-500 text-sm mb-8">
          Signed in as {ROLE_LABELS[session?.role] || 'Guest'}. Reports are scoped to your school/department.
        </p>
        <div className="grid md:grid-cols-3 gap-4 stagger">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="card p-5 group block hover:-translate-y-0.5 transition-transform duration-200"
            >
              <div className="text-[11px] font-semibold tracking-wider uppercase text-accent mb-2">{c.code}</div>
              <div className="font-semibold text-brand group-hover:text-brand-dark transition-colors">{c.title}</div>
              <div className="text-sm text-gray-500 mt-2 leading-relaxed">{c.desc}</div>
              <div className="mt-4 text-sm text-brand font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Open report →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
