'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, FieldGrid, Badge, riskTone, useToast, PageHead, TabBar } from '@/components/ui';
import { BasketManager, CreditPlanEditor, BranchDecisions, LearnerCriteriaEditor } from '@/components/AcademicSetup';
import { NaacReportPanel, NirfReportPanel, NbaReportPanel } from '@/components/ReportPanels';
import { fetchJson } from '@/lib/fetchJson';

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'baskets', label: 'Credit Baskets', icon: 'layers' },
  { id: 'naac', label: 'NAAC Report', icon: 'chart' },
  { id: 'nirf', label: 'NIRF Report', icon: 'chart' },
  { id: 'nba', label: 'NBA Report', icon: 'chart' },
];

export default function HodClient({ me }) {
  const [view, setView] = useState('overview');
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
  const [planStudent, setPlanStudent] = useState(null);
  const { show, node } = useToast();

  async function load() {
    try {
      const [m, s, mp] = await Promise.all([
        fetchJson('/api/users?role=MENTOR'),
        fetchJson('/api/students'),
        fetchJson('/api/mapping'),
      ]);
      if (!s.ok) show(s.data?.error || 'Failed to load students');
      setMentors(m.data?.users || []);
      setStudents(s.data?.students || []);
      setMappings(mp.data?.mappings || []);
    } catch (err) {
      show(err.message || 'Failed to load dashboard');
    }
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
    <Shell
      role="HOD"
      name={me.name}
      nav={NAV}
      activeNav={view}
      onNavChange={setView}
    >
      {view === 'overview' && (
        <>
      <PageHead
        eyebrow="Head of Department"
        title="Department Dashboard"
        subtitle="Provision faculty mentors, onboard students, and map mentees."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Stat label="Faculty Mentors" value={mentors.length} />
        <Stat label="Students" value={students.length} tone="gray" />
        <Stat label="Mentor : Mentee" value={ratio} tone="green" sub="NAAC 2.3.3" />
        <Stat label="Unmapped" value={unmapped.length} tone={unmapped.length ? 'amber' : 'green'} />
      </div>

      <TabBar>
        <button className={tab === 'mentors' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('mentors')}>Mentors</button>
        <button className={tab === 'students' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('students')}>Students</button>
        <button className={tab === 'mapping' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('mapping')}>Mapping</button>
        <button className={tab === 'learner' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('learner')}>Learner Policy</button>
        <button className={tab === 'branch' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('branch')}>Branch Changes</button>
      </TabBar>

      {tab === 'mentors' && (
        <Card title="Faculty Mentors" actions={<button className="btn-primary" onClick={() => setShowMentor(true)}>+ Add Mentor</button>}>
          <div className="table-wrap">
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
                {!mentors.length && <tr><td className="td text-ink/40" colSpan={5}>No mentors yet.</td></tr>}
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
          <div className="table-wrap">
            <table className="w-full">
              <thead><tr><th className="th">Reg. No</th><th className="th">Name</th><th className="th">Programme</th><th className="th">Sem</th><th className="th">CGPA</th><th className="th">Risk</th><th className="th">Mentor</th><th className="th">Credit Plan</th></tr></thead>
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
                      <td className="td"><button className="btn-ghost py-1" onClick={() => setPlanStudent(s)}>Set plan</button></td>
                    </tr>
                  );
                })}
                {!students.length && <tr><td className="td text-ink/40" colSpan={8}>No students yet. Use Import Excel to bulk-add.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'mapping' && (
        <Card title="Mentor–Mentee Mapping" actions={<button className="btn-primary" onClick={() => setShowMap(true)}>+ Map Students</button>}>
          <div className="table-wrap">
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
                {!mappings.length && <tr><td className="td text-ink/40" colSpan={5}>No mappings yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'learner' && <LearnerCriteriaEditor show={show} />}

      {tab === 'branch' && <BranchDecisions show={show} />}
        </>
      )}

      {view === 'baskets' && (
        <>
          <PageHead
            eyebrow="Head of Department"
            title="Credit Baskets"
            subtitle="Define CBCS baskets for your department. The gradesheet parser uses these names — and aliases — to place each course."
          />
          <BasketManager show={show} />
        </>
      )}

      {view === 'naac' && (
        <>
          <PageHead
            eyebrow="Reports"
            title="NAAC Report"
            subtitle="Preview mentoring metrics for NAAC. Print when you need a PDF."
          />
          <NaacReportPanel embedded />
        </>
      )}

      {view === 'nirf' && (
        <>
          <PageHead
            eyebrow="Reports"
            title="NIRF Report"
            subtitle="Preview graduation outcomes for NIRF. Print when you need a PDF."
          />
          <NirfReportPanel embedded />
        </>
      )}

      {view === 'nba' && (
        <>
          <PageHead
            eyebrow="Reports"
            title="NBA Report"
            subtitle="Preview OBE & mentoring metrics for NBA. Print when you need a PDF."
          />
          <NbaReportPanel embedded />
        </>
      )}

      <Modal
        open={!!planStudent}
        onClose={() => setPlanStudent(null)}
        title={planStudent ? `Credit Plan — ${planStudent.name}` : 'Credit Plan'}
        description="Set basket-wise credit requirements for this student."
        wide
      >
        {planStudent && <CreditPlanEditor student={planStudent} onClose={() => setPlanStudent(null)} show={show} />}
      </Modal>

      <Modal
        open={showMentor}
        onClose={() => { setShowMentor(false); setCreds(null); }}
        title="Add Faculty Mentor"
        description="Create a mentor login. A temporary password is emailed automatically."
      >
        {creds ? (
          <div className="ui-form-stack">
            <p className="text-sm text-ink/65">Account created. Save these credentials — they were also emailed.</p>
            <div className="ui-callout-warn p-3 text-sm space-y-1">
              <div><span className="text-ink/55">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-ink/55">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <button className="btn-primary hero-cta-shine w-full !py-3" onClick={() => { setShowMentor(false); setCreds(null); }}>Done</button>
          </div>
        ) : (
          <form onSubmit={createMentor} className="ui-form-stack">
            <Field label="Full name">
              <input className="input" required placeholder="Prof. C. Mentor" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" required placeholder="mentor@cutm.ac.in" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <FieldGrid>
              <Field label="Employee ID" optional>
                <input className="input" placeholder="EMP-3010" onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
              </Field>
              <Field label="Designation" optional>
                <input className="input" placeholder="Assistant Professor" onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </Field>
            </FieldGrid>
            <button className="btn-primary hero-cta-shine w-full !py-3">Create & email credentials</button>
          </form>
        )}
      </Modal>

      <Modal
        open={showStudent}
        onClose={() => setShowStudent(false)}
        title="Add Student"
        description="Only required fields are marked. You can fill the rest later."
        wide
      >
        <form onSubmit={createStudent} className="ui-form-stack">
          <FieldGrid>
            <Field label="Registration No">
              <input className="input" required placeholder="210301120001" onChange={(e) => setForm({ ...form, registrationNo: e.target.value })} />
            </Field>
            <Field label="Roll No" optional>
              <input className="input" placeholder="CSE-21-001" onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
            </Field>
            <Field label="Full name">
              <input className="input" required placeholder="Student name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email" optional>
              <input className="input" type="email" placeholder="student@cutm.ac.in" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Programme" optional>
              <input className="input" placeholder="B.Tech CSE" onChange={(e) => setForm({ ...form, programme: e.target.value })} />
            </Field>
            <Field label="Batch" optional>
              <input className="input" placeholder="2022-2026" onChange={(e) => setForm({ ...form, batch: e.target.value })} />
            </Field>
            <Field label="Current semester" optional>
              <input className="input" type="number" min="1" placeholder="3" onChange={(e) => setForm({ ...form, currentSemester: Number(e.target.value) })} />
            </Field>
            <Field label="Category" optional>
              <select className="input" defaultValue="" onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="" disabled>Choose category…</option>
                <option>GEN</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option>
              </select>
            </Field>
            <Field label="Parent email" optional>
              <input className="input" type="email" placeholder="parent@email.com" onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
            </Field>
            <Field label="Parent phone" optional>
              <input className="input" placeholder="98765 43210" onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
            </Field>
          </FieldGrid>
          <button className="btn-primary hero-cta-shine w-full !py-3">Add student</button>
        </form>
      </Modal>

      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Students from Excel"
        description="Download the template, fill it, then upload. Mentors match by MentorEmail."
      >
        {!importResult ? (
          <form onSubmit={doImport} className="ui-form-stack">
            <a className="btn-ghost w-full sm:w-auto" href="/api/students/template">Download Template</a>
            <Field label="Excel file (.xlsx)" hint="Use the template columns for a clean import.">
              <input className="input" type="file" accept=".xlsx" required onChange={(e) => setFile(e.target.files[0])} />
            </Field>
            <label className="flex items-start gap-2.5 text-sm leading-snug border border-ink/10 rounded-xl p-3 bg-white">
              <input type="checkbox" className="mt-0.5" checked={issueCreds} onChange={(e) => setIssueCreds(e.target.checked)} />
              <span>Issue login credentials to students (emails them)</span>
            </label>
            <button className="btn-primary hero-cta-shine w-full !py-3">Upload & import</button>
          </form>
        ) : (
          <div className="ui-form-stack text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="ui-callout-ok p-2">Created: <b>{importResult.created}</b></div>
              <div className="ui-callout-soft p-2">Updated: <b>{importResult.updated}</b></div>
              <div className="ui-callout-warn p-2">Mapped: <b>{importResult.mapped}</b></div>
              <div className="ui-callout-danger p-2">Credentials: <b>{importResult.credentialsIssued}</b></div>
            </div>
            {importResult.errors?.length > 0 && (
              <div className="ui-callout-danger p-2 max-h-40 overflow-y-auto">
                <div className="font-bold text-ink mb-1">{importResult.errors.length} issue(s):</div>
                {importResult.errors.map((e, i) => <div key={i} className="text-brand-dark">Row {e.row}: {e.error}</div>)}
              </div>
            )}
            <button className="btn-primary hero-cta-shine w-full !py-3" onClick={() => { setShowImport(false); setImportResult(null); }}>Done</button>
          </div>
        )}
      </Modal>

      <Modal
        open={showMap}
        onClose={() => setShowMap(false)}
        title="Map Students to a Mentor"
        description="Pick one mentor, then tick the mentees to assign."
        wide
      >
        <form onSubmit={doMap} className="ui-form-stack">
          <Field label="Mentor">
            <select className="input" value={mapMentor} onChange={(e) => setMapMentor(e.target.value)} required>
              <option value="" disabled hidden>Choose a mentor…</option>
              {mentors.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
            </select>
          </Field>
          <div>
            <div className="label"><span>Students</span><span className="ui-field-optional">{mapStudents.length} selected</span></div>
            <div className="ui-nest max-h-64 overflow-y-auto divide-y divide-ink/10">
              {students.map((s) => {
                const checked = mapStudents.includes(s._id);
                const map = mappings.find((x) => x.student?._id === s._id);
                return (
                  <label key={s._id} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-cream cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={(e) => setMapStudents(e.target.checked ? [...mapStudents, s._id] : mapStudents.filter((x) => x !== s._id))} />
                    <span className="font-medium min-w-0 truncate">{s.name}</span>
                    <span className="text-ink/40 shrink-0">{s.registrationNo}</span>
                    {map && <Badge tone="blue">→ {map.mentor?.name}</Badge>}
                  </label>
                );
              })}
              {!students.length && <div className="px-3 py-3 text-ink/40 text-sm">No students yet.</div>}
            </div>
          </div>
          <button className="btn-primary hero-cta-shine w-full !py-3">Map selected students</button>
        </form>
      </Modal>
      {node}
    </Shell>
  );
}
