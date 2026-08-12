'use client';
import { useEffect, useState } from 'react';
import ReportHeader, { Row, Signature } from '@/components/ReportHeader';

export default function NbaReport() {
  const [r, setR] = useState(null);
  useEffect(() => { fetch('/api/reports/nba').then((x) => x.json()).then((d) => setR(d.report)); }, []);
  if (!r) return <div className="p-10 text-center text-ink/40">Loading report…</div>;
  const b = r.cgpaDistribution || {};

  return (
    <div className="min-h-screen bg-cream"><div className="max-w-4xl mx-auto p-6 bg-white border-x-2 border-ink print:border-0">
      <ReportHeader
        title="NBA — Outcome-Based Education (OBE) & Mentoring Report"
        subtitle="Student performance, PO/CO attainment and at-risk intervention"
        criterion="Criteria 3 (Course Outcomes / Program Outcomes) · Student mentoring interventions"
      />

      <h3 className="font-bold text-ink mb-2">A. Academic Performance</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Total students" value={r.totalStudents} />
          <Row label="Average CGPA" value={r.averageCGPA} highlight />
          <Row label="Students with no live backlogs (%)" value={`${r.passPercent}%`} />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">B. CGPA Distribution</h3>
      <table className="w-full border-collapse mb-6 text-sm">
        <thead><tr className="bg-brand text-white"><th className="border px-2 py-1">9–10</th><th className="border px-2 py-1">8–9</th><th className="border px-2 py-1">7–8</th><th className="border px-2 py-1">6–7</th><th className="border px-2 py-1">&lt;6</th></tr></thead>
        <tbody><tr className="text-center">
          <td className="border px-2 py-1">{b['9-10'] || 0}</td><td className="border px-2 py-1">{b['8-9'] || 0}</td><td className="border px-2 py-1">{b['7-8'] || 0}</td><td className="border px-2 py-1">{b['6-7'] || 0}</td><td className="border px-2 py-1">{b['<6'] || 0}</td>
        </tr></tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">C. Outcome Attainment (OBE)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Average Course Outcome (CO) attainment level (0–3)" value={r.averageCOAttainment} highlight />
          <Row label="Average Program Outcome (PO) attainment level (0–3)" value={r.averagePOAttainment} highlight />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">D. At-Risk Student Intervention</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Students identified as at-risk (HIGH)" value={r.atRiskCount} />
          <Row label="At-risk students as % of cohort" value={`${r.atRiskPercent}%`} />
        </tbody>
      </table>

      <p className="text-xs text-ink/55 mb-6">Note: NBA emphasizes documented mentoring interventions for weak/at-risk students and the closing of the OBE attainment loop. Attainment levels are recorded per student in the mentoring profile.</p>

      <Signature />
    </div>
    </div>
  );
}
