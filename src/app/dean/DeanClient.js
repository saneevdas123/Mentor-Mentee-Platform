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

export default function DeanClient({ me }) {
  const [view, setView] = useState('overview');
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [showDept, setShowDept] = useState(false);
  const [showHod, setShowHod] = useState(false);
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
    const [d, h] = await Promise.all([
      fetch('/api/departments').then((r) => r.json()),
      fetch('/api/users?role=HOD').then((r) => r.json()),
    ]);
    setDepartments(d.departments || []);
    setHods(h.users || []);
  }
  useEffect(() => { load(); }, []);

  async function createDept(e) {
    e.preventDefault();
    const next = requiredFields({
      name: [form.name, 'Enter the department name'],
      code: [form.code, 'Enter a short department code'],
    });
    setErrors(next);
    if (Object.keys(next).length) {
      show.error('Please fill in the required fields');
      return;
    }
    await run(async () => {
      const payload = { ...form };
      if (form.programmeName) {
        payload.programmes = [{
          name: form.programmeName,
          level: form.programmeLevel || 'UG',
          durationYears: Number(form.durationYears) || 4,
          intake: Number(form.intake) || 0,
        }];
      }
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not create the department');
        return;
      }
      setShowDept(false);
      setForm({});
      setErrors({});
      show.success('Department created');
      load();
    });
  }

  async function createHod(e) {
    e.preventDefault();
    const next = requiredFields({
      department: [form.department, 'Choose a department'],
      name: [form.name, 'Enter the HoD’s full name'],
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
        body: JSON.stringify({ ...form, role: 'HOD' }),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not provision the HoD');
        return;
      }
      setForm({});
      setErrors({});
      setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null);
      show.success('HoD provisioned — save the temporary password');
      load();
    });
  }

  return (
    <Shell
      role="DEAN"
      name={me.name}
      nav={NAV}
      activeNav={view}
      onNavChange={setView}
    >
      {view === 'overview' && (
        <>
          <PageHead
            eyebrow="Dean"
            title="School Dashboard"
            subtitle="Add departments and provide access to Heads of Department."
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Stat label="Departments" value={departments.length} />
            <Stat label="HoDs" value={hods.length} tone="gray" />
            <Stat label="Students" value={departments.reduce((a, d) => a + (d.studentCount || 0), 0)} tone="green" />
          </div>

          <TabBar>
            <Tab active={tab === 'departments'} onClick={() => setTab('departments')}>Departments</Tab>
            <Tab active={tab === 'hods'} onClick={() => setTab('hods')}>HoDs</Tab>
          </TabBar>

          {tab === 'departments' && (
            <Card title="Departments" actions={<button className="btn-primary" onClick={() => { setShowDept(true); setForm({}); setErrors({}); }}>+ Add Department</button>}>
              <div className="table-wrap">
                <table className="w-full">
                  <thead><tr><th className="th">Name</th><th className="th">Code</th><th className="th">HoD</th><th className="th">Programmes</th><th className="th">Students</th></tr></thead>
                  <tbody>
                    {departments.map((d) => (
                      <tr key={d._id}>
                        <td className="td font-medium">{d.name}</td>
                        <td className="td">{d.code}</td>
                        <td className="td">{d.hod?.name || <Badge tone="amber">No HoD</Badge>}</td>
                        <td className="td">{(d.programmes || []).map((p) => p.name).join(', ') || '—'}</td>
                        <td className="td">{d.studentCount}</td>
                      </tr>
                    ))}
                    {!departments.length && <tr><td className="td text-ink/40" colSpan={5}>No departments yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {tab === 'hods' && (
            <Card title="Heads of Department" actions={<button className="btn-primary" onClick={() => { setShowHod(true); setForm({}); setErrors({}); setCreds(null); }}>+ Provision HoD</button>}>
              <div className="table-wrap">
                <table className="w-full">
                  <thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Department</th><th className="th">Last login</th></tr></thead>
                  <tbody>
                    {hods.map((h) => (
                      <tr key={h._id}>
                        <td className="td font-medium">{h.name}</td>
                        <td className="td">{h.email}</td>
                        <td className="td">{h.department?.name || '—'}</td>
                        <td className="td">{h.lastLoginAt ? new Date(h.lastLoginAt).toLocaleDateString() : <Badge tone="amber">Never</Badge>}</td>
                      </tr>
                    ))}
                    {!hods.length && <tr><td className="td text-ink/40" colSpan={4}>No HoDs yet.</td></tr>}
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
        open={showDept}
        onClose={() => setShowDept(false)}
        title="Add Department"
        description="Add a department under your school, then you can provision its HoD."
      >
        <form onSubmit={createDept} className="ui-form-stack" noValidate>
          <Field label="Department name" error={errors.name}>
            <input className="input" placeholder="Computer Science & Engineering" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} disabled={busy} />
          </Field>
          <Field label="Code" hint="Short department code." error={errors.code}>
            <input className="input" placeholder="CSE" value={form.code || ''} onChange={(e) => setField('code', e.target.value)} disabled={busy} />
          </Field>
          <FieldGrid>
            <Field label="Programme" optional>
              <input className="input" placeholder="B.Tech CSE" value={form.programmeName || ''} onChange={(e) => setField('programmeName', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Level">
              <select className="input" value={form.programmeLevel || 'UG'} onChange={(e) => setField('programmeLevel', e.target.value)} disabled={busy}>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
                <option value="PhD">PhD</option>
              </select>
            </Field>
            <Field label="Duration (years)" optional>
              <input className="input" type="number" min="1" placeholder="4" value={form.durationYears || ''} onChange={(e) => setField('durationYears', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Intake" optional>
              <input className="input" type="number" min="0" placeholder="120" value={form.intake || ''} onChange={(e) => setField('intake', e.target.value)} disabled={busy} />
            </Field>
          </FieldGrid>
          <SubmitButton loading={busy} loadingText="Creating department…">Create department</SubmitButton>
        </form>
      </Modal>

      <Modal
        open={showHod}
        onClose={() => { setShowHod(false); setCreds(null); }}
        title="Provision HoD"
        description="We’ll create their login and email a temporary password."
      >
        {creds ? (
          <div className="ui-form-stack">
            <p className="text-sm text-ink/65">Account created. Save these credentials — they were also emailed.</p>
            <div className="ui-callout-warn p-3 text-sm space-y-1">
              <div><span className="text-ink/55">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-ink/55">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <button className="btn-primary hero-cta-shine w-full !py-3" onClick={() => { setShowHod(false); setCreds(null); }}>Done</button>
          </div>
        ) : (
          <form onSubmit={createHod} className="ui-form-stack" noValidate>
            <Field label="Department" hint="HoD will manage this department." error={errors.department}>
              <select className="input" value={form.department || ''} onChange={(e) => setField('department', e.target.value)} disabled={busy}>
                <option value="" disabled>Choose a department…</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Full name" error={errors.name}>
              <input className="input" placeholder="Dr. B. Head" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" placeholder="hod@cutm.ac.in" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} disabled={busy} />
            </Field>
            <Field label="Employee ID" optional>
              <input className="input" placeholder="EMP-2048" value={form.employeeId || ''} onChange={(e) => setField('employeeId', e.target.value)} disabled={busy} />
            </Field>
            <SubmitButton loading={busy} loadingText="Creating HoD…">Create & email credentials</SubmitButton>
          </form>
        )}
      </Modal>
    </Shell>
  );
}
