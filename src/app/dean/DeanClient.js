'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, FieldGrid, Badge, useToast, PageHead, TabBar } from '@/components/ui';
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
  const [creds, setCreds] = useState(null);
  const { show, node } = useToast();

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
    const payload = { ...form };
    if (form.programmeName) payload.programmes = [{ name: form.programmeName, level: form.programmeLevel || 'UG', durationYears: Number(form.durationYears) || 4, intake: Number(form.intake) || 0 }];
    const res = await fetch('/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowDept(false); setForm({}); show('Department created'); load();
  }

  async function createHod(e) {
    e.preventDefault();
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'HOD' }) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowHod(false); setForm({}); setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null); show('HoD provisioned'); load();
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
            <button className={tab === 'departments' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('departments')}>Departments</button>
            <button className={tab === 'hods' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('hods')}>HoDs</button>
          </TabBar>

          {tab === 'departments' && (
            <Card title="Departments" actions={<button className="btn-primary" onClick={() => setShowDept(true)}>+ Add Department</button>}>
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
            <Card title="Heads of Department" actions={<button className="btn-primary" onClick={() => setShowHod(true)}>+ Provision HoD</button>}>
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
        <form onSubmit={createDept} className="ui-form-stack">
          <Field label="Department name">
            <input className="input" required placeholder="Computer Science & Engineering" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Code" hint="Short department code.">
            <input className="input" required placeholder="CSE" onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </Field>
          <FieldGrid>
            <Field label="Programme" optional>
              <input className="input" placeholder="B.Tech CSE" onChange={(e) => setForm({ ...form, programmeName: e.target.value })} />
            </Field>
            <Field label="Level">
              <select className="input" defaultValue="UG" onChange={(e) => setForm({ ...form, programmeLevel: e.target.value })}>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
                <option value="PhD">PhD</option>
              </select>
            </Field>
            <Field label="Duration (years)" optional>
              <input className="input" type="number" min="1" placeholder="4" onChange={(e) => setForm({ ...form, durationYears: e.target.value })} />
            </Field>
            <Field label="Intake" optional>
              <input className="input" type="number" min="0" placeholder="120" onChange={(e) => setForm({ ...form, intake: e.target.value })} />
            </Field>
          </FieldGrid>
          <button className="btn-primary hero-cta-shine w-full !py-3">Create department</button>
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
            <div className="bg-accent-yellow border-2 border-ink rounded-xl p-3 shadow-hard-sm text-sm space-y-1">
              <div><span className="text-ink/55">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-ink/55">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <button className="btn-primary hero-cta-shine w-full !py-3" onClick={() => { setShowHod(false); setCreds(null); }}>Done</button>
          </div>
        ) : (
          <form onSubmit={createHod} className="ui-form-stack">
            <Field label="Department" hint="HoD will manage this department.">
              <select className="input" required defaultValue="" onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="" disabled>Choose a department…</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Full name">
              <input className="input" required placeholder="Dr. B. Head" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" required placeholder="hod@cutm.ac.in" onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Employee ID" optional>
              <input className="input" placeholder="EMP-2048" onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </Field>
            <button className="btn-primary hero-cta-shine w-full !py-3">Create & email credentials</button>
          </form>
        )}
      </Modal>
      {node}
    </Shell>
  );
}
