'use client';
import { useRouter } from 'next/navigation';

export default function ReportHeader({ title, subtitle, criterion }) {
  const router = useRouter();
  return (
    <div>
      <div className="no-print flex items-center justify-between mb-4">
        <button className="btn-ghost" onClick={() => router.back()}>← Back</button>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={() => window.print()}>Print / Save as PDF</button>
        </div>
      </div>
      <div className="text-center border-b-2 border-ink pb-4 mb-6">
        <h1 className="text-xl font-bold text-ink">CENTURION UNIVERSITY OF TECHNOLOGY AND MANAGEMENT</h1>
        <div className="text-sm text-ink/65">Mentor–Mentee Programme · Internal Quality Assurance Cell (IQAC)</div>
        <h2 className="text-lg font-semibold mt-3">{title}</h2>
        {subtitle && <div className="text-sm text-ink/55">{subtitle}</div>}
        {criterion && <div className="text-xs text-ink/40 mt-1">{criterion}</div>}
        <div className="text-xs text-ink/40 mt-2">Generated on {new Date().toLocaleString()}</div>
      </div>
    </div>
  );
}

export function Row({ label, value, highlight }) {
  return (
    <tr className={highlight ? 'bg-accent-yellow' : ''}>
      <td className="border border-ink/30 px-4 py-2 text-sm">{label}</td>
      <td className="border border-ink/30 px-4 py-2 text-sm font-semibold text-right">{value}</td>
    </tr>
  );
}

export function Signature() {
  return (
    <div className="grid grid-cols-3 gap-8 mt-16 text-center text-sm">
      {['Mentoring Coordinator', 'Head of Department', 'IQAC Coordinator'].map((r) => (
        <div key={r}>
          <div className="border-t border-ink/40 pt-1">{r}</div>
        </div>
      ))}
    </div>
  );
}
