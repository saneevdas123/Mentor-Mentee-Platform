'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, useToast, Tabs, PageHeader, EmptyState, SkeletonRows, Btn } from '@/components/ui';

const NAV = [
  { href: '/dean', label: 'Overview' },
  { href: '/reports/naac', label: 'NAAC Report' },
  { href: '/reports/nirf', label: 'NIRF Report' },
  { href: '/reports/nba', label: 'NBA Report' },
];

export default function DeanClient({ me }) {
  const [tab, setTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDept, setShowDept] = useState(false);
  const [showHod, setShowHod] = useState(false);
  const [form, setForm] = useState({});
  const [creds, setCreds] = useState(null);
  const { show, node } = useToast();

  async function load() {
    try {
      const [d, h] = await Promise.all([
        fetch('/api/departments').then((r) => r.json()),
        fetch('/api/users?role=HOD').then((r) => r.json()),
      ]);
      setDepartments(d.departments || []);
      setHods(h.users || []);
    } catch {
      show('Failed to load dashboard', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function createDept(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      if (form.programmeName) payload.programmes = [{ name: form.programmeName, level: form.programmeLevel || 'UG', durationYears: Number(form.durationYears) || 4, intake: Number(form.intake) || 0 }];
      const res = await fetch('/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setShowDept(false); setForm({}); show('Department created', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  async function createHod(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'HOD' }) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setForm({}); setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null); show('HoD provisioned', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  return (
    <Shell role="DEAN" name={me.name} nav={NAV}>
      <PageHeader
        title="School Dashboard"
        subtitle="Add departments and provide access to Heads of Department."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 stagger">
        <Stat label="Departments" value={departments.length} loading={loading} />
        <Stat label="HoDs" value={hods.length} tone="gray" loading={loading} />
        <Stat label="Students" value={departments.reduce((a, d) => a + (d.studentCount || 0), 0)} tone="green" loading={loading} />
      </div>

      <Tabs
        tabs={[{ key: 'departments', label: 'Departments' }, { key: 'hods', label: 'HoDs' }]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'departments' && (
        <Card title="Departments" actions={<Btn onClick={() => setShowDept(true)}>+ Add Department</Btn>}>
          {loading ? <SkeletonRows rows={4} cols={4} /> : (
            <div className="overflow-x-auto">
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
                </tbody>
              </table>
              {!departments.length && (
                <EmptyState
                  title="No departments yet"
                  description="Add a department under your school to continue onboarding."
                  action={<Btn onClick={() => setShowDept(true)}>+ Add Department</Btn>}
                />
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'hods' && (
        <Card title="Heads of Department" actions={<Btn onClick={() => setShowHod(true)}>+ Provision HoD</Btn>}>
          {loading ? <SkeletonRows rows={4} cols={4} /> : (
            <div className="overflow-x-auto">
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
                </tbody>
              </table>
              {!hods.length && (
                <EmptyState
                  title="No HoDs yet"
                  description="Provision a Head of Department and assign them to a department."
                  action={<Btn onClick={() => setShowHod(true)}>+ Provision HoD</Btn>}
                />
              )}
            </div>
          )}
        </Card>
      )}

      <Modal open={showDept} onClose={() => setShowDept(false)} title="Add Department">
        <form onSubmit={createDept} className="space-y-3">
          <Field label="Department name"><input className="input" required placeholder="Computer Science & Engineering" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Code"><input className="input" required placeholder="e.g. CSE" onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Programme (optional)"><input className="input" placeholder="B.Tech CSE" onChange={(e) => setForm({ ...form, programmeName: e.target.value })} /></Field>
            <Field label="Level"><select className="input" onChange={(e) => setForm({ ...form, programmeLevel: e.target.value })}><option>UG</option><option>PG</option><option>PhD</option></select></Field>
            <Field label="Duration (yrs)"><input className="input" type="number" placeholder="4" onChange={(e) => setForm({ ...form, durationYears: e.target.value })} /></Field>
            <Field label="Intake"><input className="input" type="number" placeholder="120" onChange={(e) => setForm({ ...form, intake: e.target.value })} /></Field>
          </div>
          <Btn type="submit" loading={busy} className="w-full">{busy ? 'Creating…' : 'Create department'}</Btn>
        </form>
      </Modal>

      <Modal open={showHod} onClose={() => { setShowHod(false); setCreds(null); }} title="Provision HoD">
        {creds ? (
          <div className="space-y-3 animate-fade-up">
            <p className="text-sm text-gray-600">Account created and credentials emailed.</p>
            <div className="bg-brand-light rounded-lg p-3 text-sm space-y-1">
              <div><span className="text-gray-500">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-gray-500">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <Btn className="w-full" onClick={() => { setShowHod(false); setCreds(null); }}>Done</Btn>
          </div>
        ) : (
          <form onSubmit={createHod} className="space-y-3">
            <Field label="Department">
              <select className="input" required onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Select department…</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Full name"><input className="input" required placeholder="Dr. Full Name" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" type="email" required placeholder="hod@cutm.ac.in" onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Employee ID"><input className="input" placeholder="Optional" onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></Field>
            <Btn type="submit" loading={busy} className="w-full">{busy ? 'Creating…' : 'Create & email credentials'}</Btn>
          </form>
        )}
      </Modal>
      {node}
    </Shell>
  );
}
