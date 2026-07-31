'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, riskTone, statusTone, useToast, Tabs, PageHeader, EmptyState, SkeletonRows, Btn } from '@/components/ui';
import ProfileEditor from '@/components/ProfileEditor';
import MenteeWorkspace from '@/components/MenteeWorkspace';

const NAV = [{ href: '/mentor', label: 'Dashboard' }];

export default function MentorClient({ me }) {
  const [tab, setTab] = useState('mentees');
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [showMeet, setShowMeet] = useState(false);
  const [meetForm, setMeetForm] = useState({ type: 'WEEKLY_MENTORING', durationMins: 45 });
  const [viewMin, setViewMin] = useState(null);
  const [respondIssue, setRespondIssue] = useState(null);
  const { show, node } = useToast();

  async function load() {
    try {
      const [s, mt, mn, is] = await Promise.all([
        fetch('/api/students').then((r) => r.json()),
        fetch('/api/meetings').then((r) => r.json()),
        fetch('/api/minutes').then((r) => r.json()),
        fetch('/api/issues').then((r) => r.json()),
      ]);
      setStudents(s.students || []);
      setMeetings(mt.meetings || []);
      setMinutes(mn.minutes || []);
      setIssues(is.issues || []);
    } catch {
      show('Failed to load dashboard', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function saveProfile(payload) {
    const res = await fetch(`/api/students/${editing._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
    setEditing(null); show('Profile updated', { tone: 'success' }); load();
  }

  async function scheduleMeeting(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(meetForm) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setShowMeet(false); show('Meeting scheduled & invites sent', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  async function saveMinutes(payload) {
    setBusy(true);
    try {
      const res = await fetch(`/api/minutes/${viewMin._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setViewMin(data.minutes); show('Minutes saved', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  async function respond(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.target);
      const res = await fetch(`/api/issues/${respondIssue._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: fd.get('message'), status: fd.get('status') }) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setRespondIssue(null); show('Response sent', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  const highRisk = students.filter((s) => s.riskLevel === 'HIGH').length;
  const openIssues = issues.filter((i) => ['OPEN', 'IN_PROGRESS'].includes(i.status)).length;

  return (
    <Shell role="MENTOR" name={me.name} nav={NAV}>
      <PageHeader
        title="Mentor Dashboard"
        subtitle="Update mentee profiles, schedule meetings and record minutes."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <Stat label="My Mentees" value={students.length} loading={loading} />
        <Stat label="At Risk" value={highRisk} tone={highRisk ? 'red' : 'green'} loading={loading} />
        <Stat label="Open Issues" value={openIssues} tone={openIssues ? 'amber' : 'green'} loading={loading} />
        <Stat label="Meetings" value={meetings.length} tone="gray" loading={loading} />
      </div>

      <Tabs
        tabs={[
          { key: 'mentees', label: 'Mentees' },
          { key: 'meetings', label: 'Meetings' },
          { key: 'minutes', label: 'Minutes' },
          { key: 'issues', label: 'Issues' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'mentees' && (
        <Card title="My Mentees" actions={<a className="btn-primary" href="/api/reports/interactions">Download all interaction reports</a>}>
          {loading ? <SkeletonRows rows={5} cols={5} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th">Reg. No</th><th className="th">Name</th><th className="th">Programme</th><th className="th">CGPA</th><th className="th">Backlogs</th><th className="th">Risk</th><th className="th"></th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td className="td">{s.registrationNo}</td>
                      <td className="td font-medium">{s.name}</td>
                      <td className="td">{s.programme || '—'}</td>
                      <td className="td">{s.latestCGPA ?? '—'}</td>
                      <td className="td">{s.liveBacklogs ?? 0}</td>
                      <td className="td"><Badge tone={riskTone(s.riskLevel)}>{s.riskLevel}</Badge></td>
                      <td className="td whitespace-nowrap">
                        <Btn className="py-1 mr-1" onClick={() => setWorkspace(s)}>Mentoring</Btn>
                        <Btn variant="ghost" className="py-1" onClick={() => setEditing(s)}>Profile</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!students.length && (
                <EmptyState title="No mentees assigned" description="Ask your HoD to map students to you." />
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'meetings' && (
        <Card title="Meetings" actions={<Btn onClick={() => setShowMeet(true)}>+ Schedule Meeting</Btn>}>
          {loading ? <SkeletonRows rows={4} cols={4} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th">Title</th><th className="th">Type</th><th className="th">When</th><th className="th">Status</th><th className="th">Meet</th></tr></thead>
                <tbody>
                  {meetings.map((m) => (
                    <tr key={m._id}>
                      <td className="td font-medium">{m.title}</td>
                      <td className="td">{m.type.replace('_', ' ')}</td>
                      <td className="td">{new Date(m.scheduledAt).toLocaleString()}</td>
                      <td className="td"><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
                      <td className="td">{m.meetLink ? <a className="text-brand underline hover:opacity-80 transition" href={m.meetLink} target="_blank" rel="noreferrer">Join</a> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!meetings.length && (
                <EmptyState title="No meetings yet" description="Schedule one, or wait for the weekly/monthly auto-scheduler." action={<Btn onClick={() => setShowMeet(true)}>+ Schedule Meeting</Btn>} />
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'minutes' && (
        <Card title="Minutes of Meetings">
          {loading ? <SkeletonRows rows={4} cols={4} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th">Title</th><th className="th">Held on</th><th className="th">Type</th><th className="th">Finalized</th><th className="th"></th></tr></thead>
                <tbody>
                  {minutes.map((m) => (
                    <tr key={m._id}>
                      <td className="td font-medium">{m.title}</td>
                      <td className="td">{m.heldOn ? new Date(m.heldOn).toLocaleDateString() : '—'}</td>
                      <td className="td">{(m.type || '').replace('_', ' ')}</td>
                      <td className="td">{m.finalized ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">Draft</Badge>}</td>
                      <td className="td"><Btn variant="ghost" onClick={() => setViewMin(m)}>Open</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!minutes.length && (
                <EmptyState title="No minutes yet" description="Minutes are auto-generated when meetings are created." />
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'issues' && (
        <Card title="Mentee Issues">
          {loading ? <SkeletonRows rows={4} cols={5} /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><th className="th">Student</th><th className="th">Subject</th><th className="th">Category</th><th className="th">Priority</th><th className="th">Status</th><th className="th"></th></tr></thead>
                <tbody>
                  {issues.map((i) => (
                    <tr key={i._id}>
                      <td className="td">{i.student?.name}</td>
                      <td className="td font-medium">{i.subject}</td>
                      <td className="td">{i.category}</td>
                      <td className="td">{i.priority}</td>
                      <td className="td"><Badge tone={statusTone(i.status)}>{i.status}</Badge></td>
                      <td className="td"><Btn variant="ghost" onClick={() => setRespondIssue(i)}>Respond</Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!issues.length && (
                <EmptyState title="No issues raised" description="When mentees raise issues, they will appear here." />
              )}
            </div>
          )}
        </Card>
      )}

      <Modal open={!!workspace} onClose={() => { setWorkspace(null); load(); }} title="Mentoring Workspace" wide>
        {workspace && <MenteeWorkspace student={workspace} onClose={() => { setWorkspace(null); load(); }} />}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit — ${editing.name}` : ''} wide>
        {editing && <ProfileEditor student={editing} onSave={saveProfile} onClose={() => setEditing(null)} />}
      </Modal>

      <Modal open={showMeet} onClose={() => setShowMeet(false)} title="Schedule Meeting">
        <form onSubmit={scheduleMeeting} className="space-y-3">
          <Field label="Title"><input className="input" required placeholder="Weekly mentoring — Week 12" onChange={(e) => setMeetForm({ ...meetForm, title: e.target.value })} /></Field>
          <Field label="Type">
            <select className="input" value={meetForm.type} onChange={(e) => setMeetForm({ ...meetForm, type: e.target.value })}>
              <option value="WEEKLY_MENTORING">Weekly mentoring (mentees)</option>
              <option value="MONTHLY_PARENT">Monthly parent meeting (parents)</option>
              <option value="ADHOC">Ad-hoc</option>
            </select>
          </Field>
          <Field label="Date & time"><input className="input" type="datetime-local" required onChange={(e) => setMeetForm({ ...meetForm, scheduledAt: e.target.value })} /></Field>
          <Field label="Agenda"><textarea className="input" rows={2} placeholder="Topics to discuss…" onChange={(e) => setMeetForm({ ...meetForm, agenda: e.target.value })} /></Field>
          <p className="text-xs text-gray-500">A Google Meet link is generated and invitations are emailed automatically. A minutes draft is created.</p>
          <Btn type="submit" loading={busy} className="w-full">{busy ? 'Scheduling…' : 'Schedule & notify'}</Btn>
        </form>
      </Modal>

      <Modal open={!!viewMin} onClose={() => setViewMin(null)} title="Minutes of Meeting" wide>
        {viewMin && <MinutesEditor m={viewMin} onSave={saveMinutes} busy={busy} />}
      </Modal>

      <Modal open={!!respondIssue} onClose={() => setRespondIssue(null)} title="Respond to Issue">
        {respondIssue && (
          <div>
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
              <div className="font-medium">{respondIssue.subject}</div>
              <div className="text-gray-600 mt-1">{respondIssue.description}</div>
            </div>
            <div className="max-h-40 overflow-y-auto mb-3 space-y-2">
              {(respondIssue.responses || []).map((r, i) => (
                <div key={i} className="text-sm bg-brand-light rounded-lg p-2"><b>{r.byName} ({r.byRole})</b>: {r.message}</div>
              ))}
            </div>
            <form onSubmit={respond} className="space-y-3">
              <Field label="Response"><textarea name="message" className="input" rows={3} required placeholder="Write your guidance or update…" /></Field>
              <Field label="Update status">
                <select name="status" className="input" defaultValue={respondIssue.status}>
                  <option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>ESCALATED</option><option>CLOSED</option>
                </select>
              </Field>
              <Btn type="submit" loading={busy} className="w-full">{busy ? 'Sending…' : 'Send response'}</Btn>
            </form>
          </div>
        )}
      </Modal>
      {node}
    </Shell>
  );
}

function MinutesEditor({ m, onSave, busy }) {
  const [f, setF] = useState({ ...m, actionItems: m.actionItems || [], attendees: m.attendees || [] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-500">Title:</span> <b>{f.title}</b></div>
        <div><span className="text-gray-500">Held on:</span> <b>{f.heldOn ? new Date(f.heldOn).toLocaleString() : '—'}</b></div>
      </div>
      <Field label="Attendance">
        <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
          {f.attendees.map((a, i) => (
            <label key={i} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer transition">
              <input type="checkbox" checked={!!a.present} onChange={(e) => { const arr = [...f.attendees]; arr[i] = { ...a, present: e.target.checked }; set('attendees', arr); }} />
              <span>{a.name}</span><span className="text-gray-400">{a.role}</span>
            </label>
          ))}
          {!f.attendees.length && <div className="px-3 py-2 text-gray-400 text-sm">No attendees recorded.</div>}
        </div>
      </Field>
      <Field label="Agenda"><textarea className="input" rows={2} value={f.agenda || ''} placeholder="Meeting agenda…" onChange={(e) => set('agenda', e.target.value)} /></Field>
      <Field label="Discussion"><textarea className="input" rows={4} value={f.discussion || ''} placeholder="Key discussion points…" onChange={(e) => set('discussion', e.target.value)} /></Field>
      <Field label="Decisions"><textarea className="input" rows={2} value={f.decisions || ''} placeholder="Decisions taken…" onChange={(e) => set('decisions', e.target.value)} /></Field>
      <div className="flex gap-2 pt-2 border-t">
        <Btn className="flex-1" loading={busy} onClick={() => onSave(f)}>Save draft</Btn>
        <Btn variant="ghost" disabled={busy} onClick={() => onSave({ ...f, finalize: true })}>Finalize</Btn>
        <Btn variant="ghost" className="no-print" onClick={() => window.print()}>Print</Btn>
      </div>
    </div>
  );
}
