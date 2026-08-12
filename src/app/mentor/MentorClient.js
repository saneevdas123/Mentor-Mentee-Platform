'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, riskTone, statusTone, useToast } from '@/components/ui';
import ProfileEditor from '@/components/ProfileEditor';
import MenteeWorkspace from '@/components/MenteeWorkspace';
import { fetchJson } from '@/lib/fetchJson';

const NAV = [{ href: '/mentor', label: 'Dashboard' }];

const LEARNER_TONE = { ADVANCED: 'blue', AVERAGE: 'gray', SLOW: 'amber' };
const LEARNER_SHORT = { ADVANCED: 'Advanced', AVERAGE: 'Average', SLOW: 'Slow' };
function learnerBadge(cat) {
  if (!cat || cat === 'UNSET') return <span className="text-ink/30 text-xs">—</span>;
  return <Badge tone={LEARNER_TONE[cat] || 'gray'}>{LEARNER_SHORT[cat] || cat}</Badge>;
}

export default function MentorClient({ me }) {
  const [tab, setTab] = useState('mentees');
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [minutes, setMinutes] = useState([]);
  const [issues, setIssues] = useState([]);
  const [learnerMap, setLearnerMap] = useState({});
  const [editing, setEditing] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [showMeet, setShowMeet] = useState(false);
  const [meetForm, setMeetForm] = useState({ type: 'WEEKLY_MENTORING', durationMins: 45 });
  const [viewMin, setViewMin] = useState(null);
  const [respondIssue, setRespondIssue] = useState(null);
  const { show, node } = useToast();

  async function load() {
    try {
      const [s, mt, mn, is, lr] = await Promise.all([
        fetchJson('/api/students'),
        fetchJson('/api/meetings'),
        fetchJson('/api/minutes'),
        fetchJson('/api/issues'),
        fetchJson('/api/learner'),
      ]);
      if (!s.ok) show(s.data?.error || 'Failed to load students');
      setStudents(s.data?.students || []);
      setMeetings(mt.data?.meetings || []);
      setMinutes(mn.data?.minutes || []);
      setIssues(is.data?.issues || []);
      const map = {};
      (lr.data?.learners || []).forEach((l) => { map[l._id] = l.category; });
      setLearnerMap(map);
    } catch (err) {
      show(err.message || 'Failed to load dashboard');
    }
  }
  useEffect(() => { load(); }, []);

  async function saveProfile(payload) {
    const res = await fetch(`/api/students/${editing._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setEditing(null); show('Profile updated'); load();
  }

  async function scheduleMeeting(e) {
    e.preventDefault();
    const res = await fetch('/api/meetings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(meetForm) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowMeet(false); show('Meeting scheduled & invites sent'); load();
  }

  async function saveMinutes(payload) {
    const res = await fetch(`/api/minutes/${viewMin._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setViewMin(data.minutes); show('Minutes saved'); load();
  }

  async function respond(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await fetch(`/api/issues/${respondIssue._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: fd.get('message'), status: fd.get('status') }) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setRespondIssue(null); show('Response sent'); load();
  }

  const highRisk = students.filter((s) => s.riskLevel === 'HIGH').length;
  const openIssues = issues.filter((i) => ['OPEN', 'IN_PROGRESS'].includes(i.status)).length;

  return (
    <Shell role="MENTOR" name={me.name} nav={NAV}>
      <h1 className="text-2xl font-bold mb-1 tracking-tight text-ink">Mentor Dashboard</h1>
      <p className="text-ink/55 mb-6 text-sm">Update mentee profiles, schedule meetings and record minutes.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="My Mentees" value={students.length} />
        <Stat label="At Risk" value={highRisk} tone={highRisk ? 'red' : 'green'} />
        <Stat label="Open Issues" value={openIssues} tone={openIssues ? 'amber' : 'green'} />
        <Stat label="Meetings" value={meetings.length} tone="gray" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[['mentees', 'Mentees'], ['meetings', 'Meetings'], ['minutes', 'Minutes'], ['issues', 'Issues']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'mentees' && (
        <Card title="My Mentees" actions={<span className="flex gap-2"><a className="btn-ghost" href="/api/reports/learners?format=xlsx">Learner report (Excel)</a><a className="btn-ghost" href="/api/reports/interactions">Interaction report (Excel)</a></span>}>
          <div className="table-wrap">
            <table className="w-full">
              <thead><tr><th className="th">Reg. No</th><th className="th">Name</th><th className="th">Programme</th><th className="th">CGPA</th><th className="th">Backlogs</th><th className="th">Learner</th><th className="th">Risk</th><th className="th"></th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td className="td">{s.registrationNo}</td>
                    <td className="td font-medium">{s.name}</td>
                    <td className="td">{s.programme || '—'}</td>
                    <td className="td">{s.latestCGPA ?? '—'}</td>
                    <td className="td">{s.liveBacklogs ?? 0}</td>
                    <td className="td">{learnerBadge(learnerMap[s._id])}</td>
                    <td className="td"><Badge tone={riskTone(s.riskLevel)}>{s.riskLevel}</Badge></td>
                    <td className="td whitespace-nowrap">
                      <button className="btn-primary py-1 mr-1" onClick={() => setWorkspace(s)}>Mentoring</button>
                      <button className="btn-ghost py-1" onClick={() => setEditing(s)}>Profile</button>
                    </td>
                  </tr>
                ))}
                {!students.length && <tr><td className="td text-ink/40" colSpan={8}>No mentees assigned yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'meetings' && (
        <Card title="Meetings" actions={<button className="btn-primary" onClick={() => setShowMeet(true)}>+ Schedule Meeting</button>}>
          <div className="table-wrap">
            <table className="w-full">
              <thead><tr><th className="th">Title</th><th className="th">Type</th><th className="th">When</th><th className="th">Status</th><th className="th">Meet</th></tr></thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m._id}>
                    <td className="td font-medium">{m.title}</td>
                    <td className="td">{m.type.replace('_', ' ')}</td>
                    <td className="td">{new Date(m.scheduledAt).toLocaleString()}</td>
                    <td className="td"><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
                    <td className="td">{m.meetLink ? <a className="text-brand underline" href={m.meetLink} target="_blank">Join</a> : '—'}</td>
                  </tr>
                ))}
                {!meetings.length && <tr><td className="td text-ink/40" colSpan={5}>No meetings. The system also auto-schedules these weekly/monthly.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'minutes' && (
        <Card title="Minutes of Meetings">
          <div className="table-wrap">
            <table className="w-full">
              <thead><tr><th className="th">Title</th><th className="th">Held on</th><th className="th">Type</th><th className="th">Finalized</th><th className="th"></th></tr></thead>
              <tbody>
                {minutes.map((m) => (
                  <tr key={m._id}>
                    <td className="td font-medium">{m.title}</td>
                    <td className="td">{m.heldOn ? new Date(m.heldOn).toLocaleDateString() : '—'}</td>
                    <td className="td">{(m.type || '').replace('_', ' ')}</td>
                    <td className="td">{m.finalized ? <Badge tone="green">Yes</Badge> : <Badge tone="amber">Draft</Badge>}</td>
                    <td className="td"><button className="btn-ghost" onClick={() => setViewMin(m)}>Open</button></td>
                  </tr>
                ))}
                {!minutes.length && <tr><td className="td text-ink/40" colSpan={5}>Minutes are auto-generated when meetings are created.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'issues' && (
        <Card title="Mentee Issues">
          <div className="table-wrap">
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
                    <td className="td"><button className="btn-ghost" onClick={() => setRespondIssue(i)}>Respond</button></td>
                  </tr>
                ))}
                {!issues.length && <tr><td className="td text-ink/40" colSpan={6}>No issues raised.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Mentee mentoring workspace */}
      <Modal open={!!workspace} onClose={() => { setWorkspace(null); load(); }} title="Mentoring Workspace" wide>
        {workspace && <MenteeWorkspace student={workspace} onClose={() => { setWorkspace(null); load(); }} />}
      </Modal>

      {/* Profile editor */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit — ${editing.name}` : ''} wide>
        {editing && <ProfileEditor student={editing} onSave={saveProfile} onClose={() => setEditing(null)} />}
      </Modal>

      {/* Schedule meeting */}
      <Modal open={showMeet} onClose={() => setShowMeet(false)} title="Schedule Meeting">
        <form onSubmit={scheduleMeeting} className="space-y-3">
          <Field label="Title"><input className="input" required onChange={(e) => setMeetForm({ ...meetForm, title: e.target.value })} /></Field>
          <Field label="Type">
            <select className="input" value={meetForm.type} onChange={(e) => setMeetForm({ ...meetForm, type: e.target.value })}>
              <option value="WEEKLY_MENTORING">Weekly mentoring (mentees)</option>
              <option value="MONTHLY_PARENT">Monthly parent meeting (parents)</option>
              <option value="ADHOC">Ad-hoc</option>
            </select>
          </Field>
          <Field label="Date & time"><input className="input" type="datetime-local" required onChange={(e) => setMeetForm({ ...meetForm, scheduledAt: e.target.value })} /></Field>
          <Field label="Agenda"><textarea className="input" rows={2} onChange={(e) => setMeetForm({ ...meetForm, agenda: e.target.value })} /></Field>
          <p className="text-xs text-ink/55">A Google Meet link is generated and invitations are emailed automatically. A minutes draft is created.</p>
          <button className="btn-primary w-full">Schedule & notify</button>
        </form>
      </Modal>

      {/* Minutes editor */}
      <Modal open={!!viewMin} onClose={() => setViewMin(null)} title="Minutes of Meeting" wide>
        {viewMin && <MinutesEditor m={viewMin} onSave={saveMinutes} />}
      </Modal>

      {/* Respond to issue */}
      <Modal open={!!respondIssue} onClose={() => setRespondIssue(null)} title="Respond to Issue">
        {respondIssue && (
          <div>
            <div className="bg-cream rounded p-3 mb-3 text-sm">
              <div className="font-medium">{respondIssue.subject}</div>
              <div className="text-ink/65 mt-1">{respondIssue.description}</div>
            </div>
            <div className="max-h-40 overflow-y-auto mb-3 space-y-2">
              {(respondIssue.responses || []).map((r, i) => (
                <div key={i} className="text-sm bg-accent-yellow border border-ink/20 rounded-xl p-2"><b>{r.byName} ({r.byRole})</b>: {r.message}</div>
              ))}
            </div>
            <form onSubmit={respond} className="space-y-3">
              <Field label="Response"><textarea name="message" className="input" rows={3} required /></Field>
              <Field label="Update status">
                <select name="status" className="input" defaultValue={respondIssue.status}>
                  <option>OPEN</option><option>IN_PROGRESS</option><option>RESOLVED</option><option>ESCALATED</option><option>CLOSED</option>
                </select>
              </Field>
              <button className="btn-primary w-full">Send response</button>
            </form>
          </div>
        )}
      </Modal>
      {node}
    </Shell>
  );
}

function MinutesEditor({ m, onSave }) {
  const [f, setF] = useState({ ...m, actionItems: m.actionItems || [], attendees: m.attendees || [] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-ink/55">Title:</span> <b>{f.title}</b></div>
        <div><span className="text-ink/55">Held on:</span> <b>{f.heldOn ? new Date(f.heldOn).toLocaleString() : '—'}</b></div>
      </div>
      <Field label="Attendance">
        <div className="border rounded max-h-40 overflow-y-auto divide-y divide-ink/10">
          {f.attendees.map((a, i) => (
            <label key={i} className="flex items-center gap-2 px-3 py-1.5 text-sm">
              <input type="checkbox" checked={!!a.present} onChange={(e) => { const arr = [...f.attendees]; arr[i] = { ...a, present: e.target.checked }; set('attendees', arr); }} />
              <span>{a.name}</span><span className="text-ink/40">{a.role}</span>
            </label>
          ))}
          {!f.attendees.length && <div className="px-3 py-2 text-ink/40 text-sm">No attendees recorded.</div>}
        </div>
      </Field>
      <Field label="Agenda"><textarea className="input" rows={2} value={f.agenda || ''} onChange={(e) => set('agenda', e.target.value)} /></Field>
      <Field label="Discussion"><textarea className="input" rows={4} value={f.discussion || ''} onChange={(e) => set('discussion', e.target.value)} /></Field>
      <Field label="Decisions"><textarea className="input" rows={2} value={f.decisions || ''} onChange={(e) => set('decisions', e.target.value)} /></Field>
      <div className="flex gap-2 pt-2 border-t">
        <button className="btn-primary flex-1" onClick={() => onSave(f)}>Save draft</button>
        <button className="btn-ghost" onClick={() => onSave({ ...f, finalize: true })}>Finalize</button>
        <button className="btn-ghost no-print" onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}
