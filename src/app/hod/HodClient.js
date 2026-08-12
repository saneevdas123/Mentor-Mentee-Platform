'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import {
  Stat, Card, Modal, Field, FieldGrid, Badge, riskTone, useToast, PageHead, TabBar, Tab,
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
  const [issueCreds, setIssueCreds] = useState(true);
  const [mapMentor, setMapMentor] = useState('');
  const [mapStudents, setMapStudents] = useState([]);
  const [mapFilter, setMapFilter] = useState('all'); // all | unmapped
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
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role: 'MENTOR' }),
    });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowMentor(false);
    setForm({});
    setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null);
    show('Mentor provisioned');
    load();
  }

  async function createStudent(e) {
    e.preventDefault();
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowStudent(false);
    setForm({});
    show('Student added');
    load();
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
    setImportResult(data.summary);
    show('Import complete');
    load();
  }

  async function doMap(e) {
    e.preventDefault();
    if (!mapMentor || !mapStudents.length) return show('Select a mentor and students');
    const res = await fetch('/api/mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId: mapMentor, studentIds: mapStudents }),
    });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowMap(false);
    setMapMentor('');
    setMapStudents([]);
    setMapFilter('all');
    show(`Mapped ${data.mapped} students`);
    load();
  }

  const mappedIds = new Set(mappings.map((m) => m.student?._id));
  const unmapped = students.filter((s) => !mappedIds.has(s._id));
  const ratio = mentors.length ? `1 : ${Math.round(students.length / mentors.length)}` : 'N/A';

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
            subtitle="Mentors, students, mapping, learner policy, and branch decisions — for your department."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            <Stat label="Faculty Mentors" value={mentors.length} />
            <Stat label="Students" value={students.length} tone="gray" />
            <Stat label="Mentor : Mentee" value={ratio} tone="green" sub="NAAC 2.3.3" />
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
                <button type="button" className="btn-primary !py-2" onClick={() => { setShowMentor(true); setCreds(null); setForm({}); }}>
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
              subtitle="Onboard one-by-one or import from Excel; set each credit plan"
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
                  <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => { setShowStudent(true); setForm({}); }}>
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
            <button type="submit" className="btn-primary hero-cta-shine w-full !py-3">
              Create & email credentials
            </button>
          </form>
        )}
      </Modal>

      <Modal
        open={showStudent}
        onClose={() => setShowStudent(false)}
        title="Add student"
        description="Required fields first — you can enrich the profile later."
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
          <button type="submit" className="btn-primary hero-cta-shine w-full !py-3">Add student</button>
        </form>
      </Modal>

      <Modal
        open={showImport}
        onClose={() => { setShowImport(false); setImportResult(null); }}
        title="Import students from Excel"
        description="Download the template, fill it, then upload. Mentors match by MentorEmail."
      >
        {!importResult ? (
          <form onSubmit={doImport} className="ui-form-stack">
            <a className="btn-ghost w-full justify-center" href="/api/students/template">
              Download template
            </a>
            <Field label="Excel file (.xlsx)" hint="Use the template columns for a clean import.">
              <input className="input" type="file" accept=".xlsx" required onChange={(e) => setFile(e.target.files[0])} />
            </Field>
            <label className="flex items-start gap-2.5 text-sm leading-snug ui-nest p-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={issueCreds}
                onChange={(e) => setIssueCreds(e.target.checked)}
              />
              <span>Issue login credentials to students (emails them)</span>
            </label>
            <button type="submit" className="btn-primary hero-cta-shine w-full !py-3">Upload & import</button>
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
        <form onSubmit={doMap} className="ui-form-stack">
          <Field label="Mentor">
            <select className="input" value={mapMentor} onChange={(e) => setMapMentor(e.target.value)} required>
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
          <button type="submit" className="btn-primary hero-cta-shine w-full !py-3" disabled={!mapStudents.length}>
            Map {mapStudents.length || ''} selected
          </button>
        </form>
      </Modal>
      {node}
    </Shell>
  );
}
