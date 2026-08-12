'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { Stat, Card, Modal, Field, FieldGrid, Badge, statusTone, useToast, PageHead, TabBar, Tab } from '@/components/ui';
import ProfileEditor from '@/components/ProfileEditor';
import StudentAcademics from '@/components/StudentAcademics';
import { fetchJson } from '@/lib/fetchJson';

const NAV = [{ href: '/student', label: 'Dashboard' }];

const TABS = [
  ['overview', 'Overview'],
  ['academics', 'Academics'],
  ['credits', 'Credits'],
  ['issues', 'Issues'],
  ['meetings', 'Meetings'],
];

export default function StudentClient({ me }) {
  const [tab, setTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [issues, setIssues] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showIssue, setShowIssue] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { show, node } = useToast();

  async function load() {
    try {
      const [s, i, m] = await Promise.all([
        fetchJson('/api/students'),
        fetchJson('/api/issues'),
        fetchJson('/api/meetings'),
      ]);
      if (!s.ok) show(s.data?.error || 'Failed to load profile');
      if (!i.ok) show(i.data?.error || 'Failed to load issues');
      if (!m.ok) show(m.data?.error || 'Failed to load meetings');
      setProfile((s.data?.students || [])[0] || null);
      setIssues(i.data?.issues || []);
      setMeetings(m.data?.meetings || []);
    } catch (err) {
      show(err.message || 'Failed to load dashboard');
    }
  }
  useEffect(() => { load(); }, []);

  async function raiseIssue(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { res, data } = await fetchJson('/api/issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: fd.get('subject'),
        description: fd.get('description'),
        category: fd.get('category'),
        priority: fd.get('priority'),
      }),
    });
    if (!res.ok) return show(data?.error || 'Failed');
    setShowIssue(false);
    show('Issue submitted to your mentor');
    load();
  }

  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const past = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() < now)
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  const openIssues = issues.filter((i) => !['RESOLVED', 'CLOSED'].includes(i.status)).length;

  return (
    <Shell role="STUDENT" name={me.name} nav={NAV}>
      <PageHead
        eyebrow="Student"
        title="My Dashboard"
        subtitle="Profile, credits, gradesheets, and conversations with your mentor — in one place."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Stat label="CGPA" value={profile?.latestCGPA ?? '—'} />
        <Stat label="Live Backlogs" value={profile?.liveBacklogs ?? 0} tone={profile?.liveBacklogs ? 'red' : 'green'} />
        <Stat label="Placements" value={(profile?.placements || []).length} tone="gray" />
        <Stat label="Open Issues" value={openIssues} tone={openIssues ? 'amber' : 'gray'} />
      </div>

      <TabBar>
        {TABS.map(([k, l]) => (
          <Tab key={k} active={tab === k} onClick={() => setTab(k)}>{l}</Tab>
        ))}
      </TabBar>

      {tab === 'overview' && (
        <div className="space-y-4">
          {profile ? (
            <Card
              title="Your profile"
              actions={
                <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => setShowProfile(true)}>
                  Full profile
                </button>
              }
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-12 h-12 rounded-full bg-brand text-white font-bold text-lg flex items-center justify-center">
                    {(profile.name || me.name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-ink text-lg leading-tight">{profile.name || me.name}</div>
                    <div className="text-xs text-ink/50 mt-0.5">{profile.registrationNo || '—'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm flex-1 min-w-0">
                  <Info label="Programme" value={profile.programme} />
                  <Info label="Batch" value={profile.batch} />
                  <Info label="Semester" value={profile.currentSemester} />
                  <Info label="Email" value={profile.email} />
                  <Info label="Phone" value={profile.phone} />
                  <Info label="Status" value={profile.status} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-ink/8">
                <div className="ui-nest-muted p-3.5">
                  <div className="text-xs font-bold uppercase tracking-wide text-ink/45 mb-1.5">Placements</div>
                  {(profile.placements || []).length ? (
                    <ul className="space-y-1 text-sm">
                      {profile.placements.slice(0, 3).map((p, i) => (
                        <li key={i} className="text-ink/80">
                          <span className="font-medium text-ink">{p.company || p.institution || 'Placement'}</span>
                          {p.role || p.ctcLPA != null ? (
                            <span className="text-ink/50">
                              {' '}— {[p.role, p.ctcLPA != null ? `${p.ctcLPA} LPA` : null].filter(Boolean).join(' · ')}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink/45">None recorded yet.</p>
                  )}
                </div>
                <div className="ui-nest-muted p-3.5">
                  <div className="text-xs font-bold uppercase tracking-wide text-ink/45 mb-1.5">Activities</div>
                  {(profile.activities || []).length ? (
                    <ul className="space-y-1 text-sm">
                      {profile.activities.slice(0, 3).map((a, i) => (
                        <li key={i} className="text-ink/80">
                          <span className="font-medium text-ink">{a.title || 'Activity'}</span>
                          {a.category ? (
                            <span className="text-ink/50"> — {String(a.category).replace(/_/g, ' ')}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-ink/45">None recorded yet.</p>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card title="Your profile">
              <p className="text-ink/45 text-sm">Your profile has not been set up yet. Please contact your HoD.</p>
            </Card>
          )}

          {upcoming[0] && (
            <div className="ui-callout-soft p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-ink/45">Next meeting</div>
                <div className="font-semibold text-ink mt-0.5">{upcoming[0].title}</div>
                <div className="text-sm text-ink/55">{new Date(upcoming[0].scheduledAt).toLocaleString()}</div>
              </div>
              {upcoming[0].meetLink ? (
                <a className="btn-primary !py-2" href={upcoming[0].meetLink} target="_blank" rel="noreferrer">
                  Join meet
                </a>
              ) : (
                <button type="button" className="btn-ghost !py-2" onClick={() => setTab('meetings')}>
                  View meetings
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'academics' && (
        <Card title="Semester results" subtitle="SGPA, CGPA, backlogs and attendance by semester">
          {(profile?.semesterResults || []).length ? (
            <div className="table-wrap">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th">Sem</th>
                    <th className="th">Year</th>
                    <th className="th">SGPA</th>
                    <th className="th">CGPA</th>
                    <th className="th">Backlogs</th>
                    <th className="th">Att%</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(profile.semesterResults || []).map((s, i) => (
                    <tr key={i}>
                      <td className="td font-medium">{s.semester}</td>
                      <td className="td">{s.academicYear}</td>
                      <td className="td tabular-nums">{s.sgpa}</td>
                      <td className="td tabular-nums font-semibold">{s.cgpa}</td>
                      <td className="td tabular-nums">{s.backlogs}</td>
                      <td className="td tabular-nums">{s.attendancePercent}</td>
                      <td className="td">
                        <Badge tone={s.resultStatus === 'PASS' ? 'green' : s.resultStatus === 'FAIL' ? 'red' : 'gray'}>
                          {s.resultStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-ink/45 py-2">No semester results recorded yet.</p>
          )}
        </Card>
      )}

      {tab === 'credits' && <StudentAcademics student={profile} show={show} />}

      {tab === 'issues' && (
        <Card
          title="My issues"
          subtitle="Raise concerns for your mentor — they can reply here"
          actions={
            <button type="button" className="btn-primary !py-2" onClick={() => setShowIssue(true)}>
              Raise issue
            </button>
          }
        >
          {issues.length ? (
            <div className="space-y-2.5">
              {issues.map((i) => (
                <div key={i._id} className="ui-nest p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{i.subject}</div>
                      <div className="text-xs text-ink/40 mt-0.5">
                        {(i.category || '').replace(/_/g, ' ')}
                        {i.priority ? ` · ${i.priority}` : ''}
                      </div>
                    </div>
                    <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                  </div>
                  {i.description && (
                    <p className="text-sm text-ink/65 mt-2 leading-relaxed">{i.description}</p>
                  )}
                  {(i.responses || []).map((r, x) => (
                    <div key={x} className="text-sm ui-callout-soft p-2.5 mt-2">
                      <span className="font-semibold text-ink">{r.byName}:</span> {r.message}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-ink/45 mb-3">You have not raised any issues yet.</p>
              <button type="button" className="btn-primary" onClick={() => setShowIssue(true)}>
                Raise your first issue
              </button>
            </div>
          )}
        </Card>
      )}

      {tab === 'meetings' && (
        <div className="space-y-4">
          <Card title="Upcoming" subtitle="Join links appear when your mentor adds a Meet URL">
            {upcoming.length ? (
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div key={m._id} className="ui-nest p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{m.title}</div>
                      <div className="text-sm text-ink/55 mt-0.5">
                        {new Date(m.scheduledAt).toLocaleString()}
                        {m.type ? ` · ${(m.type || '').replace(/_/g, ' ')}` : ''}
                      </div>
                    </div>
                    {m.meetLink ? (
                      <a className="btn-primary !py-2 shrink-0" href={m.meetLink} target="_blank" rel="noreferrer">
                        Join
                      </a>
                    ) : (
                      <span className="text-xs text-ink/40 shrink-0">No link yet</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/45 py-1">No upcoming meetings.</p>
            )}
          </Card>

          <Card title="Past meetings">
            {past.length ? (
              <div className="table-wrap">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="th">Title</th>
                      <th className="th">When</th>
                      <th className="th">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map((m) => (
                      <tr key={m._id}>
                        <td className="td font-medium">{m.title}</td>
                        <td className="td">{new Date(m.scheduledAt).toLocaleString()}</td>
                        <td className="td">{(m.type || '').replace(/_/g, ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-ink/45 py-1">No past meetings yet.</p>
            )}
          </Card>
        </div>
      )}

      <Modal
        open={showIssue}
        onClose={() => setShowIssue(false)}
        title="Raise an Issue"
        description="Your mentor will see this and can reply from their dashboard."
      >
        <form onSubmit={raiseIssue} className="ui-form-stack">
          <Field label="Subject">
            <input name="subject" className="input" required placeholder="Short summary of the issue" />
          </Field>
          <FieldGrid>
            <Field label="Category">
              <select name="category" className="input" defaultValue="ACADEMIC">
                <option value="ACADEMIC">Academic</option>
                <option value="ATTENDANCE">Attendance</option>
                <option value="PLACEMENT">Placement</option>
                <option value="FINANCIAL">Financial</option>
                <option value="PSYCHOLOGICAL">Psychological</option>
                <option value="HOSTEL">Hostel</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Priority">
              <select name="priority" className="input" defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </Field>
          </FieldGrid>
          <Field label="Description" hint="Share enough detail for your mentor to help.">
            <textarea name="description" className="input" rows={4} required placeholder="What happened, and what do you need help with?" />
          </Field>
          <button className="btn-primary hero-cta-shine w-full !py-3">Submit to mentor</button>
        </form>
      </Modal>

      <Modal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        title="My Full Profile"
        description="Read-only view of your mentoring profile."
        wide
      >
        {profile && <ProfileEditor student={profile} readOnly />}
      </Modal>
      {node}
    </Shell>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">{label}</div>
      <div className="font-medium text-ink mt-0.5 truncate" title={value || undefined}>{value || '—'}</div>
    </div>
  );
}
