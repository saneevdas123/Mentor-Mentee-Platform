'use client';
import { useEffect, useState } from 'react';
import ReportHeader, { Row, Signature } from '@/components/ReportHeader';

export default function NirfReport() {
  const [r, setR] = useState(null);
  useEffect(() => { fetch('/api/reports/nirf').then((x) => x.json()).then((d) => setR(d.report)); }, []);
  if (!r) return <div className="p-10 text-center text-ink/40">Loading report…</div>;

  return (
    <div className="min-h-screen bg-cream"><div className="max-w-4xl mx-auto p-6 bg-white border-x-2 border-ink print:border-0">
      <ReportHeader
        title="NIRF — Graduation Outcomes (GO) Report"
        subtitle="Parameter 3: Graduation Outcomes  ·  GO = GPH + GUE + GMS"
        criterion="Combined Placement & Higher Studies (GPH) · University Examinations (GUE) · Median Salary (GMS)"
      />

      <h3 className="font-bold text-ink mb-2">A. Combined Metric — Placement & Higher Studies (GPH)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Total graduating students considered" value={r.totalStudents} />
          <Row label="Students placed (%)" value={`${r.placementPercent}%`} />
          <Row label="Students in higher studies (%)" value={`${r.higherStudiesPercent}%`} />
          <Row label="Students in entrepreneurship (%)" value={`${r.entrepreneurshipPercent}%`} />
          <Row label="Combined GPH (Placement + Higher Studies + Entrepreneurship)" value={`${r.combinedGPH}%`} highlight />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">B. Median Salary (GMS)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Median salary of placed graduates (LPA)" value={`₹ ${r.medianSalaryLPA} LPA`} highlight />
          <Row label="Highest package (LPA)" value={`₹ ${r.maxSalaryLPA} LPA`} />
          <Row label="Lowest package (LPA)" value={`₹ ${r.minSalaryLPA} LPA`} />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">C. University Examinations (GUE)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Students graduating in stipulated time (%)" value={`${r.onTimeGraduationPercent}%`} highlight />
          <Row label="Students with live backlogs" value={r.studentsWithLiveBacklogs} />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">D. Recruiters</h3>
      <div className="border-2 border-ink rounded-neo p-3 text-sm mb-6 bg-cream">
        {r.recruiters.length ? r.recruiters.join(', ') : <span className="text-ink/40">No recruiter data recorded.</span>}
      </div>

      <p className="text-xs text-ink/55 mb-6">Note: NIRF requires the median salary computed over placed graduates in the previous three years, with company-wise counts and max/min/median offered. Ensure placement records are verified before submission.</p>

      <Signature />
    </div>
    </div>
  );
}
