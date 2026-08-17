'use client';

import { useEffect, useState } from 'react';
import ReportHeader, { Row, Signature } from '@/components/ReportHeader';

function LoadingCard() {
  return (
    <div className="card bg-white p-10 text-center text-ink/40 text-sm">
      Loading report preview…
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="card bg-white p-10 text-center text-sm">
      <p className="font-semibold text-ink">Could not load this report</p>
      <p className="text-ink/55 mt-1">{message || 'Try again, or check that you are signed in as Admin, Dean, or HoD.'}</p>
    </div>
  );
}

function PreviewCard({ children }) {
  return (
    <div className="card bg-white overflow-hidden">
      <div className="p-4 sm:p-6 report-preview">{children}</div>
    </div>
  );
}

export function NaacReportPanel({ embedded = false }) {
  const [r, setR] = useState(null);
  const [list, setList] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/api/reports/naac').then((x) => x.json()),
      fetch('/api/reports/mentor-list').then((x) => x.json()),
    ]).then(([naac, mentors]) => {
      if (!alive) return;
      if (naac.error || !naac.report) {
        setErr(naac.error || 'NAAC report returned no data');
        return;
      }
      setR(naac.report);
      setList(mentors.list || []);
    }).catch(() => {
      if (alive) setErr('Network error while loading the NAAC report');
    });
    return () => { alive = false; };
  }, []);

  if (err) return <ErrorCard message={err} />;
  if (!r) return <LoadingCard />;

  return (
    <PreviewCard>
      <ReportHeader
        embedded={embedded}
        title="NAAC — Mentor-Mentee & Student Support Report"
        subtitle="Criterion 2 (Teaching-Learning) & Criterion 5 (Student Support and Progression)"
        criterion="Key Indicators 2.3.3 (Mentor:Mentee Ratio) · 5.1 (Student Mentoring & Support) · 5.2 (Student Progression)"
      />

      <h3 className="font-bold text-ink mb-2">A. Mentoring System (Metric 2.3.3)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Total number of Faculty Mentors" value={r.mentors} />
          <Row label="Total number of Students (Mentees)" value={r.students} />
          <Row label="Students mapped to a mentor" value={r.mappedStudents} />
          <Row label="Students not yet mapped" value={r.unmapped ?? Math.max((r.students || 0) - (r.mappedStudents || 0), 0)} />
          <Row label="Mentor : Mentee Ratio" value={r.ratio} highlight />
          <Row label="Mapping coverage" value={`${r.coverage}%`} />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">B. Mentoring Activity & Documentation (Metric 5.1)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Mentoring meetings conducted" value={r.mentoringMeetings} />
          <Row label="Parent–mentor meetings conducted" value={r.parentMeetings} />
          <Row label="Minutes of Meeting recorded & stored" value={r.minutesRecorded} highlight />
          <Row label="Students flagged for targeted mentoring (at-risk)" value={r.atRiskStudents} />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">C. Student Progression & Support (Criterion 5)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Students placed (%)" value={`${r.progression?.placedPercent ?? 0}%`} />
          <Row label="Students progressing to higher studies (%)" value={`${r.progression?.higherStudiesPercent ?? 0}%`} />
          <Row label="Students availing scholarships/freeships (%)" value={`${r.progression?.scholarshipPercent ?? 0}%`} />
          <Row label="Students participating in activities (%)" value={`${r.progression?.participationPercent ?? 0}%`} />
        </tbody>
      </table>

      <h3 className="font-bold text-ink mb-2">D. Mentor-wise Mentee List</h3>
      <div className="table-wrap mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-brand text-white">
              <th className="border px-2 py-1 text-left">Mentor</th>
              <th className="border px-2 py-1">Emp. ID</th>
              <th className="border px-2 py-1">Mentees</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m, i) => (
              <tr key={i}>
                <td className="border px-2 py-1">{m.mentor}</td>
                <td className="border px-2 py-1 text-center">{m.employeeId || '—'}</td>
                <td className="border px-2 py-1 text-center">{m.menteeCount}</td>
              </tr>
            ))}
            {!list.length && (
              <tr>
                <td className="border px-2 py-1 text-ink/40" colSpan={3}>No data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Signature />
    </PreviewCard>
  );
}

export function NirfReportPanel({ embedded = false }) {
  const [r, setR] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/reports/nirf')
      .then((x) => x.json())
      .then((d) => {
        if (!alive) return;
        if (d.error || !d.report) setErr(d.error || 'NIRF report returned no data');
        else setR(d.report);
      })
      .catch(() => { if (alive) setErr('Network error while loading the NIRF report'); });
    return () => { alive = false; };
  }, []);

  if (err) return <ErrorCard message={err} />;
  if (!r) return <LoadingCard />;

  return (
    <PreviewCard>
      <ReportHeader
        embedded={embedded}
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
      <div className="ui-nest-muted p-3 text-sm mb-6">
        {r.recruiters?.length ? r.recruiters.join(', ') : <span className="text-ink/40">No recruiter data recorded.</span>}
      </div>

      <p className="text-xs text-ink/55 mb-6">
        Note: NIRF requires the median salary computed over placed graduates in the previous three years.
        Ensure placement records are verified before submission.
      </p>

      <Signature />
    </PreviewCard>
  );
}

export function NbaReportPanel({ embedded = false }) {
  const [r, setR] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/reports/nba')
      .then((x) => x.json())
      .then((d) => {
        if (!alive) return;
        if (d.error || !d.report) setErr(d.error || 'NBA report returned no data');
        else setR(d.report);
      })
      .catch(() => { if (alive) setErr('Network error while loading the NBA report'); });
    return () => { alive = false; };
  }, []);

  if (err) return <ErrorCard message={err} />;
  if (!r) return <LoadingCard />;

  const b = r.cgpaDistribution || {};

  return (
    <PreviewCard>
      <ReportHeader
        embedded={embedded}
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
      <div className="table-wrap mb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-brand text-white">
              <th className="border px-2 py-1">9–10</th>
              <th className="border px-2 py-1">8–9</th>
              <th className="border px-2 py-1">7–8</th>
              <th className="border px-2 py-1">6–7</th>
              <th className="border px-2 py-1">&lt;6</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="border px-2 py-1">{b['9-10'] || 0}</td>
              <td className="border px-2 py-1">{b['8-9'] || 0}</td>
              <td className="border px-2 py-1">{b['7-8'] || 0}</td>
              <td className="border px-2 py-1">{b['6-7'] || 0}</td>
              <td className="border px-2 py-1">{b['<6'] || 0}</td>
            </tr>
          </tbody>
        </table>
      </div>

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

      <p className="text-xs text-ink/55 mb-6">
        Note: NBA emphasizes documented mentoring interventions for weak/at-risk students and closing the OBE attainment loop.
      </p>

      <Signature />
    </PreviewCard>
  );
}
