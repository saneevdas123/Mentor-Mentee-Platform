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
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Accreditation Reports</h1>
      <p className="text-gray-500 text-sm mb-6">Signed-in as {ROLE_LABELS[session?.role]}. Reports are scoped to your school/department.</p>
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card p-5 hover:shadow-md transition">
            <div className="font-semibold text-brand">{c.title}</div>
            <div className="text-sm text-gray-500 mt-2">{c.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
