'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, useToast } from '@/components/ui';

const NAV = [
  { href: '/admin', label: 'Overview' },
  { href: '/reports/naac', label: 'NAAC Report' },
  { href: '/reports/nirf', label: 'NIRF Report' },
  { href: '/reports/nba', label: 'NBA Report' },
];

export default function AdminClient({ me }) {
  const [tab, setTab] = useState('schools');
  const [schools, setSchools] = useState([]);
  const [deans, setDeans] = useState([]);
  const [showSchool, setShowSchool] = useState(false);
  const [showDean, setShowDean] = useState(false);
  const [form, setForm] = useState({});
  const [creds, setCreds] = useState(null);
  const { show, node } = useToast();

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
    const res = await fetch('/api/schools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowSchool(false); setForm({}); show('School created'); load();
  }

  async function createDean(e) {
    e.preventDefault();
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'DEAN' }) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowDean(false); setForm({}); setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null); show('Dean provisioned'); load();
  }

  const totalStudents = schools.reduce((a, s) => a + (s.studentCount || 0), 0);
  const totalDepts = schools.reduce((a, s) => a + (s.departmentCount || 0), 0);

  return (
    <Shell role="ADMIN" name={me.name} nav={NAV}>
      <h1 className="text-2xl font-bold mb-1 tracking-tight text-ink">System Overview</h1>
      <p className="text-ink/55 mb-6 text-sm">Manage schools and provision Deans. All lower levels are managed by their respective heads.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Schools" value={schools.length} />
        <Stat label="Deans" value={deans.length} tone="gray" />
        <Stat label="Departments" value={totalDepts} tone="gray" />
        <Stat label="Students" value={totalStudents} tone="green" />
      </div>

      <div className="flex gap-2 mb-4">
        <button className={tab === 'schools' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('schools')}>Schools</button>
        <button className={tab === 'deans' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('deans')}>Deans</button>
      </div>

      {tab === 'schools' && (
        <Card title="Schools" actions={<button className="btn-primary" onClick={() => setShowSchool(true)}>+ Add School</button>}>
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
        <Card title="Deans" actions={<button className="btn-primary" onClick={() => setShowDean(true)}>+ Provision Dean</button>}>
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

      <Modal open={showSchool} onClose={() => setShowSchool(false)} title="Add School">
        <form onSubmit={createSchool} className="space-y-3">
          <Field label="School name"><input className="input" required onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Code (e.g. SoET)"><input className="input" required onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Campus"><input className="input" onChange={(e) => setForm({ ...form, campus: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input" rows={2} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <button className="btn-primary w-full">Create school</button>
        </form>
      </Modal>

      <Modal open={showDean} onClose={() => { setShowDean(false); setCreds(null); }} title="Provision Dean">
        {creds ? (
          <div className="space-y-3">
            <p className="text-sm text-ink/65">Account created. Credentials have also been emailed.</p>
            <div className="bg-accent-yellow border-2 border-ink rounded-xl p-3 shadow-hard-sm text-sm">
              <div><span className="text-ink/55">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-ink/55">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <button className="btn-primary w-full" onClick={() => { setShowDean(false); setCreds(null); }}>Done</button>
          </div>
        ) : (
          <form onSubmit={createDean} className="space-y-3">
            <Field label="School">
              <select className="input" required onChange={(e) => setForm({ ...form, school: e.target.value })}>
                <option value="">Select school…</option>
                {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Full name"><input className="input" required onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" type="email" required onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Employee ID"><input className="input" onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></Field>
            <button className="btn-primary w-full">Create & email credentials</button>
          </form>
        )}
      </Modal>
      {node}
    </Shell>
  );
}
