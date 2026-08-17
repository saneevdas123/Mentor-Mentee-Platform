'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import {
  Stat, Card, Modal, Field, FieldGrid, Badge, useToast, useBusy, SubmitButton,
  requiredFields, isEmail, PageHead, TabBar, Tab,
} from '@/components/ui';
import { NaacReportPanel, NirfReportPanel, NbaReportPanel } from '@/components/ReportPanels';

const NAV = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'naac', label: 'NAAC Report', icon: 'chart' },
  { id: 'nirf', label: 'NIRF Report', icon: 'chart' },
  { id: 'nba', label: 'NBA Report', icon: 'chart' },
];

export default function AdminClient({ me }) {
  const [view, setView] = useState('overview');
  const [tab, setTab] = useState('schools');
  const [schools, setSchools] = useState([]);
  const [deans, setDeans] = useState([]);
  const [showSchool, setShowSchool] = useState(false);
  const [showDean, setShowDean] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [creds, setCreds] = useState(null);
  const [busy, run] = useBusy();
  const { show } = useToast();

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
  }

  async function load() {
    const [s, d] = await Promise.all([
      fetch('/api/schools').then((r) => r.json()),
      fetch('/api/users?role=DEAN').then((r) => r.json()),
    ]);
    setSchools(s.schools || []);
    setDeans(d.users || []);
  }
  useEffect(() => { load(); }, []);

  async function createSchool(e) {
    e.preventDefault();
    const next = requiredFields({
      name: [form.name, 'Enter the school name'],
      code: [form.code, 'Enter a short unique code'],
    });
    setErrors(next);
    if (Object.keys(next).length) {
      show.error('Please fill in the required fields');
      return;
    }
    await run(async () => {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not create the school');
        return;
      }
      setShowSchool(false);
      setForm({});
      setErrors({});
      show.success('School created');
      load();
    });
  }

  async function createDean(e) {
    e.preventDefault();
    const next = requiredFields({
      school: [form.school, 'Choose a school'],
      name: [form.name, 'Enter the dean’s full name'],
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
        body: JSON.stringify({ ...form, role: 'DEAN' }),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not provision the dean');
        return;
      }
      setForm({});
      setErrors({});
      setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null);
      show.success('Dean provisioned — save the temporary password');
      load();
    });
  }

  const totalStudents = schools.reduce((a, s) => a + (s.studentCount || 0), 0);
  const totalDepts = schools.reduce((a, s) => a + (s.departmentCount || 0), 0);

  return (
    <Shell
      role="ADMIN"
      name={me.name}
      nav={NAV}
      activeNav={view}
      onNavChange={setView}
    >
      {view === 'overview' && (
        <>
          <PageHead
            eyebrow="Administrator"
            title="System Overview"
            subtitle="Manage schools and provision Deans. All lower levels are managed by their respective heads."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Stat label="Schools" value={schools.length} />
            <Stat label="Deans" value={deans.length} tone="gray" />
            <Stat label="Departments" value={totalDepts} tone="gray" />
            <Stat label="Students" value={totalStudents} tone="green" />
          </div>

          <TabBar>
            <Tab active={tab === 'schools'} onClick={() => setTab('schools')}>Schools</Tab>
            <Tab active={tab === 'deans'} onClick={() => setTab('deans')}>Deans</Tab>
          </TabBar>

          {tab === 'schools' && (
            <Card title="Schools" actions={<button className="btn-primary" onClick={() => { setShowSchool(true); setForm({}); setErrors({}); }}>+ Add School</button>}>
              <div className="table-wrap">
                <table className="w-full">
                  <thead><tr><th className="th">Name</th><th className="th">Code</th><th className="th">Campus</th><th className="th">Dean</th><th className="th">Depts</th><th className="th">Students</th></tr></thead>
                  <tbody>
                    {schools.map((s) => (
                      <tr key={s._id}>
                        <td className="td font-medium">{s.name}</td>
                        <td className="td">{s.code}</td>
                        <td className="td">{s.campus || '—'}</td>
                        <td className="td">{s.dean?.name || <Badge tone="amber">No dean</Badge>}</td>
                        <td className="td">{s.departmentCount}</td>
                        <td className="td">{s.studentCount}</td>
                      </tr>
                    ))}
                    {!schools.length && <tr><td className="td text-ink/40" colSpan={6}>No schools yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'deans' && (
            <Card title="Deans" actions={<button className="btn-primary" onClick={() => { setShowDean(true); setForm({}); setErrors({}); setCreds(null); }}>+ Provision Dean</button>}>
              <div className="table-wrap">
                <table className="w-full">
                  <thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">School</th><th className="th">Last login</th></tr></thead>
                  <tbody>
                    {deans.map((d) => (
                      <tr key={d._id}>
                        <td className="td font-medium">{d.name}</td>
                        <td className="td">{d.email}</td>
                        <td className="td">{d.school?.name || '—'}</td>
                        <td className="td">{d.lastLoginAt ? new Date(d.lastLoginAt).toLocaleDateString() : <Badge tone="amber">Never</Badge>}</td>
                      </tr>
                    ))}
                    {!deans.length && <tr><td className="td text-ink/40" colSpan={4}>No deans yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
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
        open={showSchool}
        onClose={() => setShowSchool(false)}
        title="Add School"
        description="Create a school so you can assign a Dean next."
      >
        <form onSubmit={createSchool} className="ui-form-stack" noValidate>
          <Field label="School name" hint="Official school name as used on campus." error={errors.name}>
            <input className="input" placeholder="School of Engineering & Technology" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} disabled={busy} />
          </Field>
          <FieldGrid>
            <Field label="Code" hint="Short unique code." error={errors.code}>
              <input className="input" placeholder="SOET" value={form.code || ''} onChange={(e) => setField('code', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Campus" optional>
              <input className="input" placeholder="Bhubaneswar" value={form.campus || ''} onChange={(e) => setField('campus', e.target.value)} disabled={busy} />
            </Field>
          </FieldGrid>
          <Field label="Description" optional>
            <textarea className="input" rows={2} placeholder="Optional note about this school…" value={form.description || ''} onChange={(e) => setField('description', e.target.value)} disabled={busy} />
          </Field>
          <SubmitButton loading={busy} loadingText="Creating school…">Create school</SubmitButton>
        </form>
      </Modal>

      <Modal
        open={showDean}
        onClose={() => { setShowDean(false); setCreds(null); }}
        title="Provision Dean"
        description="We’ll create their login and email a temporary password."
      >
        {creds ? (
          <div className="ui-form-stack">
            <p className="text-sm text-ink/65">Account created. Save these credentials — they were also emailed.</p>
            <div className="ui-callout-warn p-3 text-sm space-y-1">
              <div><span className="text-ink/55">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-ink/55">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <button className="btn-primary hero-cta-shine w-full !py-3" onClick={() => { setShowDean(false); setCreds(null); }}>Done</button>
          </div>
        ) : (
          <form onSubmit={createDean} className="ui-form-stack" noValidate>
            <Field label="School" hint="Dean will manage this school only." error={errors.school}>
              <select className="input" value={form.school || ''} onChange={(e) => setField('school', e.target.value)} disabled={busy}>
                <option value="" disabled>Choose a school…</option>
                {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Full name" error={errors.name}>
              <input className="input" placeholder="Dr. A. Dean" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Email" hint="CUTM email preferred." error={errors.email}>
              <input className="input" type="email" placeholder="dean@cutm.ac.in" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Employee ID" optional>
              <input className="input" placeholder="EMP-1024" value={form.employeeId || ''} onChange={(e) => setField('employeeId', e.target.value)} disabled={busy} />
            </Field>
            <SubmitButton loading={busy} loadingText="Creating dean…">Create & email credentials</SubmitButton>
          </form>
        )}
      </Modal>
    </Shell>
  );
}
