'use client';
import { useEffect, useState } from 'react';
import ReportHeader, { Row, Signature } from '@/components/ReportHeader';
import { Spinner } from '@/components/ui';

export default function NaacReport() {
  const [r, setR] = useState(null);
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  useEffect(() => {
    Promise.all([
      fetch('/api/reports/naac').then((x) => x.json()),
      fetch('/api/reports/mentor-list').then((x) => x.json()),
    ])
      .then(([d, l]) => {
        if (!d.report) throw new Error(d.error || 'Failed to load report');
        setR(d.report);
        setList(l.list || []);
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
        <Spinner /> Loading NAAC report…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white animate-fade-up">
      <ReportHeader
        title="NAAC — Mentor-Mentee & Student Support Report"
        subtitle="Criterion 2 (Teaching-Learning) & Criterion 5 (Student Support and Progression)"
        criterion="Key Indicators 2.3.3 (Mentor:Mentee Ratio) · 5.1 (Student Mentoring & Support) · 5.2 (Student Progression)"
      />

      <h3 className="font-semibold text-brand mb-2">A. Mentoring System (Metric 2.3.3)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Total number of Faculty Mentors" value={r.mentors} />
          <Row label="Total number of Students (Mentees)" value={r.students} />
          <Row label="Students mapped to a mentor" value={r.mappedStudents} />
          <Row label="Mentor : Mentee Ratio" value={r.ratio} highlight />
          <Row label="Mapping coverage" value={`${r.coverage}%`} />
        </tbody>
      </table>

      <h3 className="font-semibold text-brand mb-2">B. Mentoring Activity & Documentation (Metric 5.1)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Mentoring meetings conducted" value={r.mentoringMeetings} />
          <Row label="Parent–mentor meetings conducted" value={r.parentMeetings} />
          <Row label="Minutes of Meeting recorded & stored" value={r.minutesRecorded} highlight />
          <Row label="Students flagged for targeted mentoring (at-risk)" value={r.atRiskStudents} />
        </tbody>
      </table>

      <h3 className="font-semibold text-brand mb-2">C. Student Progression & Support (Criterion 5)</h3>
      <table className="w-full border-collapse mb-6">
        <tbody>
          <Row label="Students placed (%)" value={`${r.progression.placedPercent}%`} />
          <Row label="Students progressing to higher studies (%)" value={`${r.progression.higherStudiesPercent}%`} />
          <Row label="Students availing scholarships/freeships (%)" value={`${r.progression.scholarshipPercent}%`} />
          <Row label="Students participating in activities (%)" value={`${r.progression.participationPercent}%`} />
        </tbody>
      </table>

      <h3 className="font-semibold text-brand mb-2">D. Mentor-wise Mentee List</h3>
      <table className="w-full border-collapse text-sm mb-6">
        <thead><tr className="bg-brand text-white"><th className="border px-2 py-1 text-left">Mentor</th><th className="border px-2 py-1">Emp. ID</th><th className="border px-2 py-1">Mentees</th></tr></thead>
        <tbody>
          {list.map((m, i) => (
            <tr key={i}><td className="border px-2 py-1">{m.mentor}</td><td className="border px-2 py-1 text-center">{m.employeeId || '—'}</td><td className="border px-2 py-1 text-center">{m.menteeCount}</td></tr>
          ))}
          {!list.length && <tr><td className="border px-2 py-1 text-gray-400" colSpan={3}>No data.</td></tr>}
        </tbody>
      </table>

      <Signature />
    </div>
  );
}
