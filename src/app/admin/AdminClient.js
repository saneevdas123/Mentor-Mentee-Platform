'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, useToast, Tabs, PageHeader, EmptyState, SkeletonRows, Btn } from '@/components/ui';

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showSchool, setShowSchool] = useState(false);
  const [showDean, setShowDean] = useState(false);
  const [form, setForm] = useState({});
  const [creds, setCreds] = useState(null);
  const { show, node } = useToast();

  async function load() {
    try {
      const [s, d] = await Promise.all([
        fetch('/api/schools').then((r) => r.json()),
        fetch('/api/users?role=DEAN').then((r) => r.json()),
      ]);
      setSchools(s.schools || []);
      setDeans(d.users || []);
    } catch {
      show('Failed to load dashboard', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function createSchool(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/schools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setShowSchool(false); setForm({}); show('School created', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  async function createDean(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'DEAN' }) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setForm({}); setCreds(data.tempPassword ? { email: data.user.email, pass: data.tempPassword } : null); show('Dean provisioned', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  const totalStudents = schools.reduce((a, s) => a + (s.studentCount || 0), 0);
  const totalDepts = schools.reduce((a, s) => a + (s.departmentCount || 0), 0);

  return (
    <Shell role="ADMIN" name={me.name} nav={NAV}>
      <PageHeader
        title="System Overview"
        subtitle="Manage schools and provision Deans. All lower levels are managed by their respective heads."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <Stat label="Schools" value={schools.length} loading={loading} />
        <Stat label="Deans" value={deans.length} tone="gray" loading={loading} />
        <Stat label="Departments" value={totalDepts} tone="gray" loading={loading} />
        <Stat label="Students" value={totalStudents} tone="green" loading={loading} />
      </div>

      <Tabs
        tabs={[{ key: 'schools', label: 'Schools' }, { key: 'deans', label: 'Deans' }]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'schools' && (
        <Card title="Schools" actions={<Btn onClick={() => setShowSchool(true)}>+ Add School</Btn>}>
          {loading ? <SkeletonRows rows={4} cols={5} /> : (
            <div className="overflow-x-auto">
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
                </tbody>
              </table>
              {!schools.length && (
                <EmptyState
                  title="No schools yet"
                  description="Create your first school to start the mentoring hierarchy."
                  action={<Btn onClick={() => setShowSchool(true)}>+ Add School</Btn>}
                />
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'deans' && (
        <Card title="Deans" actions={<Btn onClick={() => setShowDean(true)}>+ Provision Dean</Btn>}>
          {loading ? <SkeletonRows rows={4} cols={4} /> : (
            <div className="overflow-x-auto">
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
                </tbody>
              </table>
              {!deans.length && (
                <EmptyState
                  title="No deans yet"
                  description="Provision a Dean and assign them to a school."
                  action={<Btn onClick={() => setShowDean(true)}>+ Provision Dean</Btn>}
                />
              )}
            </div>
          )}
        </Card>
      )}

      <Modal open={showSchool} onClose={() => setShowSchool(false)} title="Add School">
        <form onSubmit={createSchool} className="space-y-3">
          <Field label="School name"><input className="input" required placeholder="School of Engineering & Technology" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Code"><input className="input" required placeholder="e.g. SOET" onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Campus"><input className="input" placeholder="Bhubaneswar" onChange={(e) => setForm({ ...form, campus: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input" rows={2} placeholder="Optional short description" onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Btn type="submit" loading={busy} className="w-full">{busy ? 'Creating…' : 'Create school'}</Btn>
        </form>
      </Modal>

      <Modal open={showDean} onClose={() => { setShowDean(false); setCreds(null); }} title="Provision Dean">
        {creds ? (
          <div className="space-y-3 animate-fade-up">
            <p className="text-sm text-gray-600">Account created. Credentials have also been emailed.</p>
            <div className="bg-brand-light rounded-lg p-3 text-sm space-y-1">
              <div><span className="text-gray-500">Email:</span> <b>{creds.email}</b></div>
              <div><span className="text-gray-500">Temp password:</span> <b>{creds.pass}</b></div>
            </div>
            <Btn className="w-full" onClick={() => { setShowDean(false); setCreds(null); }}>Done</Btn>
          </div>
        ) : (
          <form onSubmit={createDean} className="space-y-3">
            <Field label="School">
              <select className="input" required onChange={(e) => setForm({ ...form, school: e.target.value })}>
                <option value="">Select school…</option>
                {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Full name"><input className="input" required placeholder="Dr. Full Name" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><input className="input" type="email" required placeholder="dean@cutm.ac.in" onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Employee ID"><input className="input" placeholder="Optional" onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></Field>
            <Btn type="submit" loading={busy} className="w-full">{busy ? 'Creating…' : 'Create & email credentials'}</Btn>
          </form>
        )}
      </Modal>
      {node}
    </Shell>
  );
}
