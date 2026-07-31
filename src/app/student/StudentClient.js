'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, Badge, statusTone, useToast, Tabs, PageHeader, EmptyState, SkeletonRows, Btn } from '@/components/ui';
import ProfileEditor from '@/components/ProfileEditor';
import StudentAcademics from '@/components/StudentAcademics';

const NAV = [{ href: '/student', label: 'Dashboard' }];

export default function StudentClient({ me }) {
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [issues, setIssues] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { show, node } = useToast();

  async function load() {
    try {
      const [s, i, m] = await Promise.all([
        fetch('/api/students').then((r) => r.json()),
        fetch('/api/issues').then((r) => r.json()),
        fetch('/api/meetings').then((r) => r.json()),
      ]);
      setProfile((s.students || [])[0] || null);
      setIssues(i.issues || []);
      setMeetings(m.meetings || []);
    } catch {
      show('Failed to load dashboard', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function raiseIssue(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const fd = new FormData(e.target);
      const res = await fetch('/api/issues', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: fd.get('subject'), description: fd.get('description'), category: fd.get('category'), priority: fd.get('priority') }) });
      const data = await res.json();
      if (!res.ok) return show(data.error || 'Failed', { tone: 'error' });
      setShowIssue(false); show('Issue submitted to your mentor', { tone: 'success' }); load();
    } finally { setBusy(false); }
  }

  return (
    <Shell role="STUDENT" name={me.name} nav={NAV}>
      <PageHeader
        title="My Dashboard"
        subtitle="View your academic profile, placements, activities and raise issues to your mentor."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
        <Stat label="CGPA" value={profile?.latestCGPA ?? '—'} loading={loading} />
        <Stat label="Live Backlogs" value={profile?.liveBacklogs ?? 0} tone={profile?.liveBacklogs ? 'red' : 'green'} loading={loading} />
        <Stat label="Placements" value={(profile?.placements || []).length} tone="gray" loading={loading} />
        <Stat label="Activities" value={(profile?.activities || []).length} tone="gray" loading={loading} />
      </div>

      <Tabs
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'academics', label: 'Academics' },
          { key: 'credits', label: 'Credits & Counselling' },
          { key: 'issues', label: 'My Issues' },
          { key: 'meetings', label: 'Meetings' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <Card title="Profile" actions={profile ? <Btn variant="ghost" onClick={() => setShowProfile(true)}>View full profile</Btn> : null}>
          {loading ? <SkeletonRows rows={3} cols={3} /> : profile ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm stagger">
              <Info label="Registration No" value={profile.registrationNo} />
              <Info label="Programme" value={profile.programme} />
              <Info label="Batch" value={profile.batch} />
              <Info label="Current Semester" value={profile.currentSemester} />
              <Info label="Email" value={profile.email} />
              <Info label="Phone" value={profile.phone} />
              <Info label="Mentor" value={profile.mentorName || 'See Meetings tab'} />
              <Info label="Status" value={profile.status} />
            </div>
          ) : (
            <EmptyState title="Profile not set up" description="Your academic profile has not been created yet. Please contact your HoD." />
          )}
        </Card>
      )}

      {tab === 'academics' && (
        <Card title="Semester Results">
          {loading ? <SkeletonRows rows={4} cols={5} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th className="th">Sem</th><th className="th">Year</th><th className="th">SGPA</th><th className="th">CGPA</th><th className="th">Backlogs</th><th className="th">Att%</th><th className="th">Status</th></tr></thead>
                <tbody>
                  {(profile?.semesterResults || []).map((s, i) => (
                    <tr key={i}>
                      <td className="td">{s.semester}</td>
                      <td className="td">{s.academicYear}</td>
                      <td className="td">{s.sgpa}</td>
                      <td className="td">{s.cgpa}</td>
                      <td className="td">{s.backlogs}</td>
                      <td className="td">{s.attendancePercent}</td>
                      <td className="td"><Badge tone={s.resultStatus === 'PASS' ? 'green' : s.resultStatus === 'FAIL' ? 'red' : 'gray'}>{s.resultStatus}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!(profile?.semesterResults || []).length && (
                <EmptyState title="No results yet" description="Semester results will appear here once your mentor or HoD records them." />
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'credits' && (
        loading ? <Card title="Credits"><SkeletonRows rows={4} cols={3} /></Card> : <StudentAcademics student={profile} show={show} />
      )}

      {tab === 'issues' && (
        <Card title="My Issues" actions={<Btn onClick={() => setShowIssue(true)}>+ Raise Issue</Btn>}>
          {loading ? <SkeletonRows rows={3} cols={2} /> : (
            <div className="space-y-2">
              {issues.map((i) => (
                <div key={i._id} className="border border-gray-200 rounded-xl p-3 hover:border-brand/30 hover:bg-brand-light/20 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{i.subject}</div>
                    <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{i.description}</div>
                  {(i.responses || []).map((r, x) => (
                    <div key={x} className="text-sm bg-brand-light rounded-lg p-2 mt-2"><b>{r.byName}:</b> {r.message}</div>
                  ))}
                </div>
              ))}
              {!issues.length && (
                <EmptyState title="No issues yet" description="Need help? Raise an issue and your mentor will respond." action={<Btn onClick={() => setShowIssue(true)}>+ Raise Issue</Btn>} />
              )}
            </div>
          )}
        </Card>
      )}

      {tab === 'meetings' && (
        <Card title="Upcoming & Past Meetings">
          {loading ? <SkeletonRows rows={4} cols={4} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th className="th">Title</th><th className="th">When</th><th className="th">Type</th><th className="th">Join</th></tr></thead>
                <tbody>
                  {meetings.map((m) => {
                    const upcoming = new Date(m.scheduledAt) >= new Date();
                    return (
                      <tr key={m._id}>
                        <td className="td font-medium">
                          <span className="inline-flex items-center gap-2">
                            {m.title}
                            {upcoming && <Badge tone="brand">Upcoming</Badge>}
                          </span>
                        </td>
                        <td className="td">{new Date(m.scheduledAt).toLocaleString()}</td>
                        <td className="td">{(m.type || '').replace('_', ' ')}</td>
                        <td className="td">{m.meetLink ? <a className="text-brand underline hover:opacity-80 transition" href={m.meetLink} target="_blank" rel="noreferrer">Join</a> : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!meetings.length && (
                <EmptyState title="No meetings scheduled" description="Your mentor’s weekly sessions will show up here with a Meet link." />
              )}
            </div>
          )}
        </Card>
      )}

      <Modal open={showIssue} onClose={() => setShowIssue(false)} title="Raise an Issue">
        <form onSubmit={raiseIssue} className="space-y-3">
          <Field label="Subject"><input name="subject" className="input" required placeholder="Brief subject line" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><select name="category" className="input"><option>ACADEMIC</option><option>ATTENDANCE</option><option>PLACEMENT</option><option>FINANCIAL</option><option>PSYCHOLOGICAL</option><option>HOSTEL</option><option>OTHER</option></select></Field>
            <Field label="Priority"><select name="priority" className="input"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></Field>
          </div>
          <Field label="Description"><textarea name="description" className="input" rows={4} required placeholder="Describe the issue so your mentor can help…" /></Field>
          <Btn type="submit" loading={busy} className="w-full">{busy ? 'Submitting…' : 'Submit to mentor'}</Btn>
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
    <div className="rounded-lg bg-gray-50/80 border border-gray-100 px-3 py-2.5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium mt-0.5">{value || '—'}</div>
    </div>
  );
}
