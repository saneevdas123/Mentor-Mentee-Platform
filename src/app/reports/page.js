import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { ROLE_LABELS } from '@/lib/rbac';

export default async function ReportsIndex() {
  const session = await getSession();
  const cards = [
    { href: '/reports/naac', title: 'NAAC Report', desc: 'Mentor-mentee ratio, mentoring activity, student progression (Criteria 2 & 5).' },
    { href: '/reports/nirf', title: 'NIRF Report', desc: 'Graduation Outcomes — placement %, higher studies, median salary.' },
    { href: '/reports/nba', title: 'NBA Report', desc: 'OBE — CGPA distribution, PO/CO attainment, at-risk intervention.' },
  ];
  return (
    <div className="min-h-screen bg-cream p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-ink">Accreditation Reports</h1>
        <p className="text-ink/55 text-sm mb-6">Signed-in as {ROLE_LABELS[session?.role]}. Reports are scoped to your school/department.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              className={`card p-5 transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg ${
                i === 0 ? 'bg-accent-yellow' : i === 1 ? 'bg-accent-mint' : 'bg-accent-peach'
              }`}
            >
              <div className="font-bold text-ink">{c.title}</div>
              <div className="text-sm text-ink/55 mt-2">{c.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
