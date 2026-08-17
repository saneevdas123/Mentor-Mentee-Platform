'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ReportHeader({ title, subtitle, criterion, scope, embedded = false }) {
  const router = useRouter();
  return (
    <div>
      <div className={`no-print flex flex-col gap-2 sm:flex-row sm:items-center mb-4 ${embedded ? 'sm:justify-end' : 'sm:justify-between'}`}>
        {!embedded ? (
          <button className="btn-ghost w-full sm:w-auto" onClick={() => router.back()}>← Back</button>
        ) : null}
        <button className="btn-primary hero-cta-shine w-full sm:w-auto" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>
      <div className="text-center border-b-2 border-ink pb-4 mb-6">
        <div className="flex justify-center mb-3">
          <Image
            src="/cutm-logo.png"
            alt="Centurion University"
            width={72}
            height={110}
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>
        <h1 className="text-base sm:text-xl font-bold text-ink leading-snug px-1">
          CENTURION UNIVERSITY OF TECHNOLOGY AND MANAGEMENT
        </h1>
        <div className="text-sm text-ink/65 mt-1">Mentor–Mentee Programme · Internal Quality Assurance Cell (IQAC)</div>
        <h2 className="text-base sm:text-lg font-semibold mt-3 px-1">{title}</h2>
        {subtitle && <div className="text-sm text-ink/55 px-1">{subtitle}</div>}
        {criterion && <div className="text-xs text-ink/40 mt-1 px-1">{criterion}</div>}
        {scope ? <div className="text-sm font-semibold text-ink mt-2 px-1">Scope: {scope}</div> : null}
        <div className="text-xs text-ink/40 mt-2">Generated on {new Date().toLocaleString()}</div>
      </div>
    </div>
  );
}

export function Row({ label, value, highlight }) {
  return (
    <tr className={highlight ? 'bg-accent-yellow' : ''}>
      <td className="border border-ink/30 px-3 sm:px-4 py-2 text-sm">{label}</td>
      <td className="border border-ink/30 px-3 sm:px-4 py-2 text-sm font-semibold text-right whitespace-nowrap">{value}</td>
    </tr>
  );
}

export function Signature() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 text-center text-sm">
      {['Mentoring Coordinator', 'Head of Department', 'IQAC Coordinator'].map((r) => (
        <div key={r}>
          <div className="border-t border-ink/40 pt-1">{r}</div>
        </div>
      ))}
    </div>
  );
}
