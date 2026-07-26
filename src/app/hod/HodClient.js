'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, riskTone, useToast } from '@/components/ui';

const NAV = [
  { href: '/hod', label: 'Overview' },
  { href: '/reports/naac', label: 'NAAC Report' },
  { href: '/reports/nirf', label: 'NIRF Report' },
  { href: '/reports/nba', label: 'NBA Report' },
];

export default function HodClient({ me }) {
  const [tab, setTab] = useState('mentors');
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [showMentor, setShowMentor] = useState(false);
  const [showStudent, setShowStudent] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState({});
  const [creds, setCreds] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [file, setFile] = useState(null);
  const [issueCreds, setIssueCreds] = useState(true);
  const [mapMentor, setMapMentor] = useState('');
  const [mapStudents, setMapStudents] = useState([]);
  const { show, node } = useToast();

  async function load() {
    const [m, s, mp] = await Promise.all([
      fetch('/api/users?role=MENTOR').then((r) => r.json()),
      fetch('/api/students').then((r) => r.json()),
      fetch('/api/mapping').then((r) => r.json()),
    ]);
    setMentors(m.users || []);
    setStudents(s.students || []);
    setMappings(mp.mappings || []);
  }
  useEffect(() => { load(); }, []);

  async function createMentor(e) {
    e.preventDefault();
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'MENTOR' }) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowMentor(false); setForm({}); setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null); show('Mentor provisioned'); load();
  }

  async function createStudent(e) {
    e.preventDefault();
    const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowStudent(false); setForm({}); show('Student added'); load();
  }

  async function doImport(e) {
    e.preventDefault();
    if (!file) return show('Choose a file');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('issueCredentials', String(issueCreds));
    const res = await fetch('/api/students/import', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Import failed');
    setImportResult(data.summary); show('Import complete'); load();
  }

  async function doMap(e) {
    e.preventDefault();
    if (!mapMentor || !mapStudents.length) return show('Select a mentor and students');
    const res = await fetch('/api/mapping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mentorId: mapMentor, studentIds: mapStudents }) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowMap(false); setMapMentor(''); setMapStudents([]); show(`Mapped ${data.mapped} students`); load();
  }

  const mappedIds = new Set(mappings.map((m) => m.student?._id));
  const unmapped = students.filter((s) => !mappedIds.has(s._id));
  const ratio = mentors.length ? `1 : ${Math.round(students.length / mentors.length)}` : 'N/A';

  return (
    <Shell role="HOD" name={me.name} nav={NAV}>
      <h1 className="text-2xl font-bold mb-1">Department Dashboard</h1>
      <p className="text-gray-500 mb-6 text-sm">Provision faculty mentors, onboard students, and map mentees.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Faculty Mentors" value={mentors.length} />
        <Stat label="Students" value={students.length} tone="gray" />
        <Stat label="Mentor : Mentee" value={ratio} tone="green" sub="NAAC 2.3.3" />
        <Stat label="Unmapped" value={unmapped.length} tone={unmapped.length ? 'amber' : 'green'} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button className={tab === 'mentors' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('mentors')}>Mentors</button>
        <button className={tab === 'students' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('students')}>Students</button>
        <button className={tab === 'mapping' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('mapping')}>Mapping</button>
      </div>

      {tab === 'mentors' && (
        <Card title="Faculty Mentors" actions={<button className="btn-primary" onClick={() => setShowMentor(true)}>+ Add Mentor</button>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Employee ID</th><th className="th">Mentees</th><th className="th">Last login</th></tr></thead>
              <tbody>
                {mentors.map((m) => {
                  const count = mappings.filter((x) => x.mentor?._id === m._id).length;
                  return (
                    <tr key={m._id}>
                      <td className="td font-medium">{m.name}</td>
                      <td className="td">{m.email}</td>
                      <td className="td">{m.employeeId || '—'}</td>
                      <td className="td">{count}</td>
                      <td className="td">{m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : <Badge tone="amber">Never</Badge>}</td>
                    </tr>
                  );
                })}
                {!mentors.length && <tr><td className="td text-gray-400" colSpan={5}>No mentors yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'students' && (
        <Card title="Students" actions={
          <div className="flex gap-2">
            <a className="btn-ghost" href="/api/students/template">Download Template</a>
            <a className="btn-ghost" href="/api/students/export">Export</a>
            <button className="btn-ghost" onClick={() => { setShowImport(true); setImportResult(null); }}>Import Excel</button>
            <button className="btn-primary" onClick={() => setShowStudent(true)}>+ Add Student</button>
          </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="th">Reg. No</th><th className="th">Name</th><th className="th">Programme</th><th className="th">Sem</th><th className="th">CGPA</th><th className="th">Risk</th><th className="th">Mentor</th></tr></thead>
              <tbody>
                {students.map((s) => {
                  const map = mappings.find((x) => x.student?._id === s._id);
                  return (
                    <tr key={s._id}>
                      <td className="td">{s.registrationNo}</td>
                      <td className="td font-medium">{s.name}</td>
                      <td className="td">{s.programme || '—'}</td>
                      <td className="td">{s.currentSemester || '—'}</td>
                      <td className="td">{s.latestCGPA ?? '—'}</td>
                      <td className="td"><Badge tone={riskTone(s.riskLevel)}>{s.riskLevel}</Badge></td>
                      <td className="td">{map ? map.mentor?.name : <Badge tone="amber">Unmapped</Badge>}</td>
                    </tr>
                  );
                })}
                {!students.length && <tr><td className="td text-gray-400" colSpan={7}>No students yet. Use Import Excel to bulk-add.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'mapping' && (
        <Card title="Mentor–Mentee Mapping" actions={<button className="btn-primary" onClick={() => setShowMap(true)}>+ Map Students</button>}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="th">Mentor</th><th className="th">Student</th><th className="th">Reg. No</th><th className="th">CGPA</th><th className="th">Risk</th></tr></thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m._id}>
                    <td className="td font-medium">{m.mentor?.name}</td>
                    <td className="td">{m.student?.name}</td>
                    <td className="td">{m.student?.registrationNo}</td>
                    <td className="td">{m.student?.latestCGPA ?? '—'}</td>
                    <td className="td"><Badge tone={riskTone(m.student?.riskLevel)}>{m.student?.riskLevel}</Badge></td>
                  </tr>
                ))}
                {!mappings.length && <tr><td className="td text-gray-400" colSpan={5}>No mappings yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Mentor */}
      <Modal open={showMentor} onClose={() => { setShowMentor(false); setCreds(null); }} title="Add Faculty Mentor">
        {creds ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Account created and credentials emailed.</p>
            <div className="bg-brand-light rounded-lg p-3 text-sm">
              <div><span className="text-gray-500">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-gray-500">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <button className="btn-primary w-full" onClick={() => { setShowMentor(false); setCreds(null); }}>Done</button>
          </div>
        ) : (
          <form onSubmit={createMentor} className="space-y-3">
            <Field label="Full name"><input className="input" required onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" type="email" required onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Employee ID"><input className="input" onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></Field>
            <Field label="Designation"><input className="input" onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
            <button className="btn-primary w-full">Create & email credentials</button>
          </form>
        )}
      </Modal>

      {/* Add Student */}
      <Modal open={showStudent} onClose={() => setShowStudent(false)} title="Add Student" wide>
        <form onSubmit={createStudent} className="grid grid-cols-2 gap-3">
          <Field label="Registration No *"><input className="input" required onChange={(e) => setForm({ ...form, registrationNo: e.target.value })} /></Field>
          <Field label="Roll No"><input className="input" onChange={(e) => setForm({ ...form, rollNo: e.target.value })} /></Field>
          <Field label="Name *"><input className="input" required onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input" type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Programme"><input className="input" onChange={(e) => setForm({ ...form, programme: e.target.value })} /></Field>
          <Field label="Batch"><input className="input" placeholder="2022-2026" onChange={(e) => setForm({ ...form, batch: e.target.value })} /></Field>
          <Field label="Current semester"><input className="input" type="number" onChange={(e) => setForm({ ...form, currentSemester: Number(e.target.value) })} /></Field>
          <Field label="Category"><select className="input" onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">—</option><option>GEN</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option></select></Field>
          <Field label="Parent email"><input className="input" type="email" onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} /></Field>
          <Field label="Parent phone"><input className="input" onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} /></Field>
          <div className="col-span-2"><button className="btn-primary w-full">Add student</button></div>
        </form>
      </Modal>

      {/* Import */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Students from Excel">
        {!importResult ? (
          <form onSubmit={doImport} className="space-y-3">
            <p className="text-sm text-gray-600">Download the template, fill it, then upload here. Students are matched to mentors by <b>MentorEmail</b>.</p>
            <a className="btn-ghost" href="/api/students/template">Download Template</a>
            <Field label="Excel file (.xlsx)"><input className="input" type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={issueCreds} onChange={(e) => setIssueCreds(e.target.checked)} /> Issue login credentials to students (emails them)</label>
            <button className="btn-primary w-full">Upload & import</button>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 rounded p-2">Created: <b>{importResult.created}</b></div>
              <div className="bg-blue-50 rounded p-2">Updated: <b>{importResult.updated}</b></div>
              <div className="bg-brand-light rounded p-2">Mapped: <b>{importResult.mapped}</b></div>
              <div className="bg-amber-50 rounded p-2">Credentials: <b>{importResult.credentialsIssued}</b></div>
            </div>
            {importResult.errors?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded p-2 max-h-40 overflow-y-auto">
                <div className="font-medium text-red-700 mb-1">{importResult.errors.length} issue(s):</div>
                {importResult.errors.map((e, i) => <div key={i} className="text-red-600">Row {e.row}: {e.error}</div>)}
              </div>
            )}
            <button className="btn-primary w-full" onClick={() => { setShowImport(false); setImportResult(null); }}>Done</button>
          </div>
        )}
      </Modal>

      {/* Map */}
      <Modal open={showMap} onClose={() => setShowMap(false)} title="Map Students to a Mentor" wide>
        <form onSubmit={doMap} className="space-y-3">
          <Field label="Mentor">
            <select className="input" value={mapMentor} onChange={(e) => setMapMentor(e.target.value)} required>
              <option value="">Select mentor…</option>
              {mentors.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
            </select>
          </Field>
          <div>
            <label className="label">Select students ({mapStudents.length} selected)</label>
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto divide-y">
              {students.map((s) => {
                const checked = mapStudents.includes(s._id);
                const map = mappings.find((x) => x.student?._id === s._id);
                return (
                  <label key={s._id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                    <input type="checkbox" checked={checked} onChange={(e) => setMapStudents(e.target.checked ? [...mapStudents, s._id] : mapStudents.filter((x) => x !== s._id))} />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-gray-400">{s.registrationNo}</span>
                    {map && <Badge tone="blue">→ {map.mentor?.name}</Badge>}
                  </label>
                );
              })}
              {!students.length && <div className="px-3 py-2 text-gray-400 text-sm">No students.</div>}
            </div>
          </div>
          <button className="btn-primary w-full">Map selected students</button>
        </form>
      </Modal>
      {node}
    </Shell>
  );
}
