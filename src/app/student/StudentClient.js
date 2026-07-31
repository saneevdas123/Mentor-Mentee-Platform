'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, statusTone, useToast } from '@/components/ui';
import ProfileEditor from '@/components/ProfileEditor';
import StudentAcademics from '@/components/StudentAcademics';

const NAV = [{ href: '/student', label: 'Dashboard' }];

export default function StudentClient({ me }) {
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [issues, setIssues] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showIssue, setShowIssue] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { show, node } = useToast();

  async function load() {
    const [s, i, m] = await Promise.all([
      fetch('/api/students').then((r) => r.json()),
      fetch('/api/issues').then((r) => r.json()),
      fetch('/api/meetings').then((r) => r.json()),
    ]);
    setProfile((s.students || [])[0] || null);
    setIssues(i.issues || []);
    setMeetings(m.meetings || []);
  }
  useEffect(() => { load(); }, []);

  async function raiseIssue(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await fetch('/api/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: fd.get('subject'), description: fd.get('description'), category: fd.get('category'), priority: fd.get('priority') }) });
    const data = await res.json();
    if (!res.ok) return show(data.error || 'Failed');
    setShowIssue(false); show('Issue submitted to your mentor'); load();
  }

  const upcoming = meetings.filter((m) => new Date(m.scheduledAt) >= new Date());

  return (
    <Shell role="STUDENT" name={me.name} nav={NAV}>
      <h1 className="text-2xl font-bold mb-1">My Dashboard</h1>
      <p className="text-gray-500 mb-6 text-sm">View your academic profile, placements, activities and raise issues to your mentor.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="CGPA" value={profile?.latestCGPA ?? '—'} />
        <Stat label="Live Backlogs" value={profile?.liveBacklogs ?? 0} tone={profile?.liveBacklogs ? 'red' : 'green'} />
        <Stat label="Placements" value={(profile?.placements || []).length} tone="gray" />
        <Stat label="Activities" value={(profile?.activities || []).length} tone="gray" />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[['overview', 'Overview'], ['academics', 'Academics'], ['credits', 'Credits & Counselling'], ['issues', 'My Issues'], ['meetings', 'Meetings']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && profile && (
        <Card title="Profile" actions={<button className="btn-ghost" onClick={() => setShowProfile(true)}>View full profile</button>}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label="Registration No" value={profile.registrationNo} />
            <Info label="Programme" value={profile.programme} />
            <Info label="Batch" value={profile.batch} />
            <Info label="Current Semester" value={profile.currentSemester} />
            <Info label="Email" value={profile.email} />
            <Info label="Phone" value={profile.phone} />
            <Info label="Mentor" value={profile.mentorName || 'See Meetings tab'} />
            <Info label="Status" value={profile.status} />
          </div>
        </Card>
      )}
      {tab === 'overview' && !profile && <Card title="Profile"><p className="text-gray-400 text-sm">Your profile has not been set up yet. Please contact your HoD.</p></Card>}

      {tab === 'academics' && (
        <Card title="Semester Results">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Sem</th><th className="th">Year</th><th className="th">SGPA</th><th className="th">CGPA</th><th className="th">Backlogs</th><th className="th">Att%</th><th className="th">Status</th></tr></thead>
            <tbody>
              {(profile?.semesterResults || []).map((s, i) => (
                <tr key={i}><td className="td">{s.semester}</td><td className="td">{s.academicYear}</td><td className="td">{s.sgpa}</td><td className="td">{s.cgpa}</td><td className="td">{s.backlogs}</td><td className="td">{s.attendancePercent}</td><td className="td"><Badge tone={s.resultStatus === 'PASS' ? 'green' : s.resultStatus === 'FAIL' ? 'red' : 'gray'}>{s.resultStatus}</Badge></td></tr>
              ))}
              {!(profile?.semesterResults || []).length && <tr><td className="td text-gray-400" colSpan={7}>No results recorded yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {tab === 'credits' && <StudentAcademics student={profile} show={show} />}

      {tab === 'issues' && (
        <Card title="My Issues" actions={<button className="btn-primary" onClick={() => setShowIssue(true)}>+ Raise Issue</button>}>
          <div className="space-y-2">
            {issues.map((i) => (
              <div key={i._id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{i.subject}</div>
                  <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                </div>
                <div className="text-sm text-gray-600 mt-1">{i.description}</div>
                {(i.responses || []).map((r, x) => (
                  <div key={x} className="text-sm bg-brand-light rounded p-2 mt-2"><b>{r.byName}:</b> {r.message}</div>
                ))}
              </div>
            ))}
            {!issues.length && <p className="text-gray-400 text-sm">You have not raised any issues.</p>}
          </div>
        </Card>
      )}

      {tab === 'meetings' && (
        <Card title="Upcoming & Past Meetings">
          <table className="w-full text-sm">
            <thead><tr><th className="th">Title</th><th className="th">When</th><th className="th">Type</th><th className="th">Join</th></tr></thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m._id}>
                  <td className="td font-medium">{m.title}</td>
                  <td className="td">{new Date(m.scheduledAt).toLocaleString()}</td>
                  <td className="td">{(m.type || '').replace('_', ' ')}</td>
                  <td className="td">{m.meetLink ? <a className="text-brand underline" href={m.meetLink} target="_blank">Join</a> : '—'}</td>
                </tr>
              ))}
              {!meetings.length && <tr><td className="td text-gray-400" colSpan={4}>No meetings scheduled yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={showIssue} onClose={() => setShowIssue(false)} title="Raise an Issue">
        <form onSubmit={raiseIssue} className="space-y-3">
          <Field label="Subject"><input name="subject" className="input" required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><select name="category" className="input"><option>ACADEMIC</option><option>ATTENDANCE</option><option>PLACEMENT</option><option>FINANCIAL</option><option>PSYCHOLOGICAL</option><option>HOSTEL</option><option>OTHER</option></select></Field>
            <Field label="Priority"><select name="priority" className="input"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></Field>
          </div>
          <Field label="Description"><textarea name="description" className="input" rows={4} required /></Field>
          <button className="btn-primary w-full">Submit to mentor</button>
        </form>
      </Modal>

      <Modal open={showProfile} onClose={() => setShowProfile(false)} title="My Full Profile" wide>
        {profile && <ProfileEditor student={profile} readOnly />}
      </Modal>
      {node}
    </Shell>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value || '—'}</div>
    </div>
  );
}
