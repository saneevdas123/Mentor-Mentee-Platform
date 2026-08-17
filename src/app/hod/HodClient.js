'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import {
  Stat, Card, Modal, Field, FieldGrid, Badge, riskTone, useToast, useBusy, SubmitButton,
  requiredFields, isEmail, PageHead, TabBar, Tab,
} from '@/components/ui';
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

function initials(name) {
  return (name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

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
  const [mapMentor, setMapMentor] = useState('');
  const [mapStudents, setMapStudents] = useState([]);
  const [mapFilter, setMapFilter] = useState('all'); // all | unmapped
  const [planStudent, setPlanStudent] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, run] = useBusy();
  const { show } = useToast();

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
  }

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
    const next = requiredFields({
      name: [form.name, 'Enter the mentor’s full name'],
      email: [form.email, 'Enter an email address'],
    });
    if (form.email && !isEmail(form.email)) next.email = 'Enter a valid email address';
    setErrors(next);
    if (Object.keys(next).length) {
      show.error('Please fill in the required fields');
      return;
    }
    await run(async () => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'MENTOR' }),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not provision the mentor');
        return;
      }
      setShowMentor(false);
      setForm({});
      setErrors({});
      setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null);
      show.success('Mentor provisioned — save the temporary password');
      load();
    });
  }

  async function createStudent(e) {
    e.preventDefault();
    const next = requiredFields({
      registrationNo: [form.registrationNo, 'Enter the registration number'],
      name: [form.name, 'Enter the student’s full name'],
      email: [form.email, 'Enter an email to send login credentials'],
    });
    if (form.email && !isEmail(form.email)) next.email = 'Enter a valid email address';
    setErrors(next);
    if (Object.keys(next).length) {
      show.error('Please fill in the required fields');
      return;
    }
    await run(async () => {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, issueCredentials: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not add the student');
        return;
      }
      setForm({});
      setErrors({});
      if (data.tempPassword) {
        setCreds({ email: data.student?.email || form.email, pass: data.tempPassword });
        show.success(data.credentialsEmailed ? 'Student added — credentials emailed' : 'Student added — save the temporary password');
      } else {
        setShowStudent(false);
        show.success('Student added');
      }
      load();
    });
  }

  async function doImport(e) {
    e.preventDefault();
    if (!file) {
      setErrors({ file: 'Choose an Excel (.xlsx) file' });
      show.error('Choose an Excel file to import');
      return;
    }
    setErrors({});
    await run(async () => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/students/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Import failed');
        return;
      }
      setImportResult(data.summary);
      show.success('Import complete');
      load();
    });
  }

  async function doMap(e) {
    e.preventDefault();
    const next = {};
    if (!mapMentor) next.mentor = 'Choose a mentor';
    if (!mapStudents.length) next.students = 'Select at least one student';
    setErrors(next);
    if (Object.keys(next).length) {
      show.error('Select a mentor and at least one student');
      return;
    }
    await run(async () => {
      const res = await fetch('/api/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: mapMentor, studentIds: mapStudents }),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not map students');
        return;
      }
      setShowMap(false);
      setMapMentor('');
      setMapStudents([]);
      setMapFilter('all');
      setErrors({});
      show.success(`Mapped ${data.mapped} student${data.mapped === 1 ? '' : 's'}`);
      load();
    });
  }

  const LEFT = ['DROPPED', 'DETAINED', 'ON_LEAVE'];
  const activeMentors = mentors.filter((m) => m.isActive !== false);
  const enrolled = students.filter((s) => !LEFT.includes(s.status));
  const mappedIds = new Set(mappings.map((m) => m.student?._id));
  const unmapped = enrolled.filter((s) => !mappedIds.has(s._id));
  const ratio = activeMentors.length ? `1 : ${Math.round(enrolled.length / activeMentors.length)}` : 'N/A';
  const dept = me.departmentName || 'your department';

  const mapListStudents = mapFilter === 'unmapped'
    ? students.filter((s) => !mappedIds.has(s._id))
    : students;

  const mentorLoad = mentors
    .map((m) => ({
      ...m,
      menteeCount: mappings.filter((x) => x.mentor?._id === m._id).length,
    }))
    .sort((a, b) => b.menteeCount - a.menteeCount);

  return (
    <Shell role="HOD" name={me.name} nav={NAV} activeNav={view} onNavChange={setView}>
      {view === 'overview' && (
        <>
          <PageHead
            eyebrow="Head of Department"
            title="Department Dashboard"
            subtitle={`Mentors, students, mapping, learner policy, and branch decisions — ${dept}.`}
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <Stat label="Faculty Mentors" value={activeMentors.length} />
            <Stat label="Students" value={enrolled.length} tone="gray" />
            <Stat label="Mentor : Mentee" value={ratio} tone="green" sub={`${enrolled.length} students · NAAC 2.3.3`} />
            <Stat label="Unmapped" value={unmapped.length} tone={unmapped.length ? 'amber' : 'green'} />
          </div>

          <TabBar>
            <Tab active={tab === 'mentors'} onClick={() => setTab('mentors')}>Mentors</Tab>
            <Tab active={tab === 'students'} onClick={() => setTab('students')}>Students</Tab>
            <Tab active={tab === 'mapping'} onClick={() => setTab('mapping')}>
              Mapping{unmapped.length ? ` (${unmapped.length})` : ''}
            </Tab>
            <Tab active={tab === 'learner'} onClick={() => setTab('learner')}>Learner Policy</Tab>
            <Tab active={tab === 'branch'} onClick={() => setTab('branch')}>Branch Changes</Tab>
          </TabBar>

          {tab === 'mentors' && (
            <Card
              title="Faculty mentors"
              subtitle="Provision faculty and track mentee load"
              actions={(
                <button type="button" className="btn-primary !py-2" onClick={() => { setShowMentor(true); setCreds(null); setForm({}); setErrors({}); }}>
                  Add mentor
                </button>
              )}
            >
              {mentorLoad.length ? (
                <div className="space-y-2">
                  {mentorLoad.map((m) => (
                    <div key={m._id} className="ui-nest p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center shrink-0">
                          {initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-ink truncate">{m.name}</div>
                          <div className="text-xs text-ink/45 truncate">
                            {m.email}
                            {m.employeeId ? ` · ${m.employeeId}` : ''}
                            {m.designation ? ` · ${m.designation}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm tabular-nums">
                          <b className="text-ink">{m.menteeCount}</b>
                          <span className="text-ink/40"> mentee{m.menteeCount === 1 ? '' : 's'}</span>
                        </span>
                        {m.lastLoginAt ? (
                          <span className="text-xs text-ink/40">
                            Last login {new Date(m.lastLoginAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <Badge tone="amber">Never logged in</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-ink/45 mb-3">No mentors yet. Add faculty to start mapping mentees.</p>
                  <button type="button" className="btn-primary" onClick={() => setShowMentor(true)}>Add first mentor</button>
                </div>
              )}
            </Card>
          )}

          {tab === 'students' && (
            <Card
              title="Students"
              subtitle={`${me.departmentName ? `${me.departmentName} · ` : ''}Add one-by-one or import Excel. Credentials are emailed every time. Then map them to a mentor.`}
              actions={(
                <div className="flex flex-wrap gap-2">
                  <a className="btn-ghost !py-1.5 !px-3 text-xs" href="/api/students/template">Template</a>
                  <a className="btn-ghost !py-1.5 !px-3 text-xs" href="/api/students/export">Export</a>
                  <button
                    type="button"
                    className="btn-ghost !py-1.5 !px-3 text-xs"
                    onClick={() => { setShowImport(true); setImportResult(null); setFile(null); }}
                  >
                    Import
                  </button>
                  <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => { setShowStudent(true); setForm({}); setErrors({}); setCreds(null); }}>
                    Add student
                  </button>
                </div>
              )}
            >
              {unmapped.length > 0 && (
                <div className="ui-callout-warn p-3 text-sm mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <b>{unmapped.length}</b> student{unmapped.length > 1 ? 's' : ''} without a mentor.
                  </span>
                  <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => { setTab('mapping'); setShowMap(true); setMapFilter('unmapped'); }}>
                    Map now
                  </button>
                </div>
              )}
              {students.length ? (
                <div className="table-wrap">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="th">Student</th>
                        <th className="th">Programme</th>
                        <th className="th">Sem</th>
                        <th className="th">CGPA</th>
                        <th className="th">Risk</th>
                        <th className="th">Mentor</th>
                        <th className="th" />
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => {
                        const map = mappings.find((x) => x.student?._id === s._id);
                        return (
                          <tr key={s._id}>
                            <td className="td">
                              <div className="font-medium text-ink">{s.name}</div>
                              <div className="text-xs text-ink/40">{s.registrationNo}</div>
                            </td>
                            <td className="td">{s.programme || '—'}</td>
                            <td className="td tabular-nums">{s.currentSemester || '—'}</td>
                            <td className="td tabular-nums font-semibold">{s.latestCGPA ?? '—'}</td>
                            <td className="td"><Badge tone={riskTone(s.riskLevel)}>{s.riskLevel || 'LOW'}</Badge></td>
                            <td className="td">
                              {map ? map.mentor?.name : <Badge tone="amber">Unmapped</Badge>}
                            </td>
                            <td className="td text-right whitespace-nowrap">
                              <button
                                type="button"
                                className="btn-ghost !py-1.5 !px-3 text-xs"
                                onClick={() => setPlanStudent(s)}
                              >
                                Credit plan
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-ink/45 mb-3">No students yet. Import Excel for a fast start.</p>
                  <button type="button" className="btn-primary" onClick={() => setShowImport(true)}>Import Excel</button>
                </div>
              )}
            </Card>
          )}

          {tab === 'mapping' && (
            <div className="space-y-4">
              {unmapped.length > 0 && (
                <div className="ui-callout-warn p-3.5 text-sm flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-ink">{unmapped.length} unmapped</div>
                    <p className="text-ink/65 mt-0.5">Assign them so mentors can counsel and track credits.</p>
                  </div>
                  <button type="button" className="btn-primary !py-2" onClick={() => { setShowMap(true); setMapFilter('unmapped'); }}>
                    Map students
                  </button>
                </div>
              )}
              <Card
                title="Mentor–mentee mapping"
                subtitle="Who mentors whom across the department"
                actions={(
                  <button type="button" className="btn-primary !py-2" onClick={() => { setShowMap(true); setMapFilter('all'); }}>
                    Map students
                  </button>
                )}
              >
                {mappings.length ? (
                  <div className="table-wrap">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="th">Mentor</th>
                          <th className="th">Student</th>
                          <th className="th">Reg. No</th>
                          <th className="th">CGPA</th>
                          <th className="th">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappings.map((m) => (
                          <tr key={m._id}>
                            <td className="td font-medium">{m.mentor?.name}</td>
                            <td className="td">{m.student?.name}</td>
                            <td className="td text-ink/60">{m.student?.registrationNo}</td>
                            <td className="td tabular-nums">{m.student?.latestCGPA ?? '—'}</td>
                            <td className="td">
                              <Badge tone={riskTone(m.student?.riskLevel)}>{m.student?.riskLevel || 'LOW'}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-ink/45 py-4 text-center">No mappings yet. Map students to mentors above.</p>
                )}
              </Card>
            </div>
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
            subtitle="Define CBCS baskets for plans and gradesheets. Aliases help match labels printed on PDFs."
          />
          <BasketManager show={show} />
        </>
      )}

      {view === 'naac' && (
        <>
          <PageHead
            eyebrow="Reports"
            title="NAAC Report"
            subtitle={`Department preview for ${dept}. Print when you need a PDF.`}
          />
          <NaacReportPanel embedded />
        </>
      )}

      {view === 'nirf' && (
        <>
          <PageHead
            eyebrow="Reports"
            title="NIRF Report"
            subtitle={`Department graduation outcomes for ${dept}. Print when you need a PDF.`}
          />
          <NirfReportPanel embedded />
        </>
      )}

      {view === 'nba' && (
        <>
          <PageHead
            eyebrow="Reports"
            title="NBA Report"
            subtitle={`Department OBE & mentoring metrics for ${dept}. Print when you need a PDF.`}
          />
          <NbaReportPanel embedded />
        </>
      )}

      <Modal
        open={!!planStudent}
        onClose={() => setPlanStudent(null)}
        title={planStudent ? `Credit plan — ${planStudent.name}` : 'Credit plan'}
        description={planStudent ? `${planStudent.registrationNo || ''} · Set basket-wise credit requirements` : undefined}
        wide
      >
        {planStudent && (
          <CreditPlanEditor student={planStudent} onClose={() => setPlanStudent(null)} show={show} />
        )}
      </Modal>

      <Modal
        open={showMentor || !!creds}
        onClose={() => { setShowMentor(false); setCreds(null); }}
        title={creds ? 'Mentor created' : 'Add faculty mentor'}
        description={creds ? 'Save these credentials — they were also emailed.' : 'Creates a mentor login with a temporary password.'}
      >
        {creds ? (
          <div className="ui-form-stack">
            <div className="ui-callout-warn p-3.5 text-sm space-y-1.5">
              <div><span className="text-ink/50">Email</span><div className="font-bold text-ink">{creds.email}</div></div>
              <div><span className="text-ink/50">Temp password</span><div className="font-bold text-ink font-mono">{creds.pass}</div></div>
            </div>
            <button type="button" className="btn-primary hero-cta-shine w-full !py-3" onClick={() => { setShowMentor(false); setCreds(null); }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={createMentor} className="ui-form-stack" noValidate>
            <Field label="Full name" error={errors.name}>
              <input className="input" placeholder="Prof. C. Mentor" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" placeholder="mentor@cutm.ac.in" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} disabled={busy} />
            </Field>
            <FieldGrid>
              <Field label="Employee ID" optional>
                <input className="input" placeholder="EMP-3010" value={form.employeeId || ''} onChange={(e) => setField('employeeId', e.target.value)} disabled={busy} />
              </Field>
              <Field label="Designation" optional>
                <input className="input" placeholder="Assistant Professor" value={form.designation || ''} onChange={(e) => setField('designation', e.target.value)} disabled={busy} />
              </Field>
            </FieldGrid>
            <SubmitButton loading={busy} loadingText="Creating mentor…">Create & email credentials</SubmitButton>
          </form>
        )}
      </Modal>

      <Modal
        open={showStudent}
        onClose={() => { setShowStudent(false); setCreds(null); }}
        title="Add student"
        description={creds ? 'Save these credentials — they were also emailed to the student.' : `Adds the student to ${me.departmentName || 'your department'} and emails their login.`}
        wide
      >
        {creds ? (
          <div className="ui-form-stack">
            <p className="text-sm text-ink/65">Account created. The student can sign in with these details.</p>
            <div className="ui-callout-warn p-3 text-sm space-y-1">
              <div><span className="text-ink/55">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-ink/55">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <button type="button" className="btn-primary hero-cta-shine w-full !py-3" onClick={() => { setShowStudent(false); setCreds(null); }}>Done</button>
          </div>
        ) : (
        <form onSubmit={createStudent} className="ui-form-stack" noValidate>
          {me.departmentName ? (
            <p className="text-sm text-ink/55">Department: <b className="text-ink">{me.departmentName}</b></p>
          ) : null}
          <FieldGrid>
            <Field label="Registration No" error={errors.registrationNo}>
              <input className="input" placeholder="210301120001" value={form.registrationNo || ''} onChange={(e) => setField('registrationNo', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Roll No" optional>
              <input className="input" placeholder="CSE-21-001" value={form.rollNo || ''} onChange={(e) => setField('rollNo', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Full name" error={errors.name}>
              <input className="input" placeholder="Student name" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Email" hint="Login credentials are emailed here." error={errors.email}>
              <input className="input" type="email" placeholder="student@cutm.ac.in" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Programme" optional>
              <input className="input" placeholder="B.Tech CSE" value={form.programme || ''} onChange={(e) => setField('programme', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Batch" optional>
              <input className="input" placeholder="2022-2026" value={form.batch || ''} onChange={(e) => setField('batch', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Current semester" optional>
              <input className="input" type="number" min="1" placeholder="3" value={form.currentSemester || ''} onChange={(e) => setField('currentSemester', Number(e.target.value))} disabled={busy} />
            </Field>
            <Field label="Category" optional>
              <select className="input" value={form.category || ''} onChange={(e) => setField('category', e.target.value)} disabled={busy}>
                <option value="" disabled>Choose category…</option>
                <option>GEN</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option>
              </select>
            </Field>
            <Field label="Parent email" optional>
              <input className="input" type="email" placeholder="parent@email.com" value={form.parentEmail || ''} onChange={(e) => setField('parentEmail', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Parent phone" optional>
              <input className="input" placeholder="98765 43210" value={form.parentPhone || ''} onChange={(e) => setField('parentPhone', e.target.value)} disabled={busy} />
            </Field>
          </FieldGrid>
          <SubmitButton loading={busy} loadingText="Adding student…">Add student & email credentials</SubmitButton>
        </form>
        )}
      </Modal>

      <Modal
        open={showImport}
        onClose={() => { setShowImport(false); setImportResult(null); }}
        title="Import students from Excel"
        description="Students are added to your department. Each row with an email gets a login mail. Mentors match by MentorEmail."
      >
        {!importResult ? (
          <form onSubmit={doImport} className="ui-form-stack" noValidate>
            <a className="btn-ghost w-full justify-center" href="/api/students/template">
              Download template
            </a>
            <Field label="Excel file (.xlsx)" hint="Use the template. Login credentials are emailed for every row that has an Email." error={errors.file}>
              <input className="input" type="file" accept=".xlsx" onChange={(e) => { setFile(e.target.files[0]); setErrors((p) => ({ ...p, file: undefined })); }} disabled={busy} />
            </Field>
            <p className="text-sm text-ink/55 ui-nest p-3">
              Credentials are emailed to each student automatically. Fill <b>MentorEmail</b> to map them in the same import.
            </p>
            <SubmitButton loading={busy} loadingText="Importing…">Upload & import</SubmitButton>
          </form>
        ) : (
          <div className="ui-form-stack text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="ui-callout-ok p-3">Created<br /><b className="text-lg">{importResult.created}</b></div>
              <div className="ui-callout-soft p-3">Updated<br /><b className="text-lg">{importResult.updated}</b></div>
              <div className="ui-callout-warn p-3">Mapped<br /><b className="text-lg">{importResult.mapped}</b></div>
              <div className="ui-callout-danger p-3">Credentials<br /><b className="text-lg">{importResult.credentialsIssued}</b></div>
            </div>
            {importResult.errors?.length > 0 && (
              <div className="ui-callout-danger p-3 max-h-40 overflow-y-auto">
                <div className="font-bold text-ink mb-1">{importResult.errors.length} issue(s)</div>
                {importResult.errors.map((e, i) => (
                  <div key={i} className="text-brand-dark text-xs mt-0.5">Row {e.row}: {e.error}</div>
                ))}
              </div>
            )}
            <button
              type="button"
              className="btn-primary hero-cta-shine w-full !py-3"
              onClick={() => { setShowImport(false); setImportResult(null); }}
            >
              Done
            </button>
          </div>
        )}
      </Modal>

      <Modal
        open={showMap}
        onClose={() => setShowMap(false)}
        title="Map students to a mentor"
        description="Pick one mentor, then tick mentees to assign."
        wide
      >
        <form onSubmit={doMap} className="ui-form-stack" noValidate>
          <Field label="Mentor" error={errors.mentor}>
            <select className="input" value={mapMentor} onChange={(e) => { setMapMentor(e.target.value); setErrors((p) => ({ ...p, mentor: undefined })); }} disabled={busy}>
              <option value="" disabled hidden>Choose a mentor…</option>
              {mentors.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </Field>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="label !mb-0">
                <span>Students</span>
                <span className="ui-field-optional">{mapStudents.length} selected</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className={`ui-tab !text-xs !py-1.5 !px-2.5 !mb-0 ${mapFilter === 'all' ? 'is-active' : ''}`}
                  onClick={() => setMapFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`ui-tab !text-xs !py-1.5 !px-2.5 !mb-0 ${mapFilter === 'unmapped' ? 'is-active' : ''}`}
                  onClick={() => setMapFilter('unmapped')}
                >
                  Unmapped ({unmapped.length})
                </button>
              </div>
            </div>
            <div className="ui-nest max-h-64 overflow-y-auto divide-y divide-ink/8">
              {mapListStudents.map((s) => {
                const checked = mapStudents.includes(s._id);
                const map = mappings.find((x) => x.student?._id === s._id);
                return (
                  <label key={s._id} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-cream/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setMapStudents(
                        e.target.checked
                          ? [...mapStudents, s._id]
                          : mapStudents.filter((x) => x !== s._id)
                      )}
                    />
                    <span className="font-medium min-w-0 truncate text-ink">{s.name}</span>
                    <span className="text-ink/40 shrink-0 text-xs">{s.registrationNo}</span>
                    {map && <Badge tone="blue">→ {map.mentor?.name}</Badge>}
                  </label>
                );
              })}
              {!mapListStudents.length && (
                <div className="px-3 py-4 text-ink/40 text-sm text-center">
                  {mapFilter === 'unmapped' ? 'Everyone is mapped.' : 'No students yet.'}
                </div>
              )}
            </div>
          </div>
          {errors.students ? <p className="ui-field-error" role="alert">{errors.students}</p> : null}
          <SubmitButton loading={busy} loadingText="Mapping…" disabled={!mapStudents.length && !errors.students}>
            Map {mapStudents.length || ''} selected
          </SubmitButton>
        </form>
      </Modal>
    </Shell>
  );
}
