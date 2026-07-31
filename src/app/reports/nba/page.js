'use client';
import { useEffect, useState } from 'react';
import ReportHeader, { Row, Signature } from '@/components/ReportHeader';
import { Spinner } from '@/components/ui';

export default function NbaReport() {
  const [r, setR] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch('/api/reports/nba')
      .then((x) => x.json())
      .then((d) => {
        if (!d.report) throw new Error(d.error || 'Failed to load report');
        setR(d.report);
      })
      .catch((e) => setErr(e.message || 'Failed to load report'));
  }, []);
  if (err) {
    return (
      <div className="p-10 text-center animate-fade-up">
        <div className="text-red-600 text-sm mb-3">{err}</div>
        <button type="button" className="btn-ghost" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }
  if (!r) {
    return (
      <div className="p-10 text-center text-gray-500 text-sm animate-fade-in flex items-center justify-center gap-2">
        <Spinner /> Loading NBA report…
      </div>
    );
  }
  const b = r.cgpaDistribution || {};

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white animate-fade-up">
      <ReportHeader
        title="NBA — Outcome-Based Education (OBE) & Mentoring Report"
        subtitle="Student performance, PO/CO attainment and at-risk intervention"
        criterion="Criteria 3 (Course Outcomes / Program Outcomes) · Student mentoring interventions"
      />

      <h3 className="font-semibold text-brand mb-2">A. Academic Performance</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Total students" value={r.totalStudents} />
          <Row label="Average CGPA" value={r.averageCGPA} highlight />
          <Row label="Students with no live backlogs (%)" value={`${r.passPercent}%`} />
        </tbody>
      </table>

      <h3 className="font-semibold text-brand mb-2">B. CGPA Distribution</h3>
      <table className="w-full border-collapse mb-6 text-sm">
        <thead><tr className="bg-brand text-white"><th className="border px-2 py-1">9–10</th><th className="border px-2 py-1">8–9</th><th className="border px-2 py-1">7–8</th><th className="border px-2 py-1">6–7</th><th className="border px-2 py-1">&lt;6</th></tr></thead>
        <tbody><tr className="text-center">
          <td className="border px-2 py-1">{b['9-10'] || 0}</td><td className="border px-2 py-1">{b['8-9'] || 0}</td><td className="border px-2 py-1">{b['7-8'] || 0}</td><td className="border px-2 py-1">{b['6-7'] || 0}</td><td className="border px-2 py-1">{b['<6'] || 0}</td>
        </tr></tbody>
      </table>

      <h3 className="font-semibold text-brand mb-2">C. Outcome Attainment (OBE)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Average Course Outcome (CO) attainment level (0–3)" value={r.averageCOAttainment} highlight />
          <Row label="Average Program Outcome (PO) attainment level (0–3)" value={r.averagePOAttainment} highlight />
        </tbody>
      </table>

      <h3 className="font-semibold text-brand mb-2">D. At-Risk Student Intervention</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Students identified as at-risk (HIGH)" value={r.atRiskCount} />
          <Row label="At-risk students as % of cohort" value={`${r.atRiskPercent}%`} />
        </tbody>
      </table>

      <p className="text-xs text-gray-500 mb-6">Note: NBA emphasizes documented mentoring interventions for weak/at-risk students and the closing of the OBE attainment loop. Attainment levels are recorded per student in the mentoring profile.</p>

      <Signature />
    </div>
  );
}
