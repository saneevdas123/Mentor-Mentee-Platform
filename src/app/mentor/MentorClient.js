'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import {
  Stat, Card, Modal, Field, FieldGrid, Badge, riskTone, statusTone,
  useToast, useBusy, SubmitButton, requiredFields, PageHead, TabBar, Tab,
} from '@/components/ui';
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

function initials(name) {
  return (name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
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
  const [errors, setErrors] = useState({});
  const [busy, run] = useBusy();
  const { show } = useToast();

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
    return run(async () => {
      const res = await fetch(`/api/students/${editing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not update the profile');
        return;
      }
      setEditing(null);
      show.success('Profile updated');
      load();
    });
  }

  async function scheduleMeeting(e) {
    e.preventDefault();
    const next = requiredFields({
      title: [meetForm.title, 'Enter a meeting title'],
      scheduledAt: [meetForm.scheduledAt, 'Choose a date and time'],
    });
    setErrors(next);
    if (Object.keys(next).length) {
      show.error('Please fill in the required fields');
      return;
    }
    await run(async () => {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetForm),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not schedule the meeting');
        return;
      }
      setShowMeet(false);
      setMeetForm({ type: 'WEEKLY_MENTORING', durationMins: 45 });
      setErrors({});
      show.success('Meeting scheduled — invites sent');
      load();
    });
  }

  async function saveMinutes(payload) {
    await run(async () => {
      const res = await fetch(`/api/minutes/${viewMin._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not save minutes');
        return;
      }
      setViewMin(data.minutes);
      show.success(payload.finalize ? 'Minutes finalized' : 'Minutes saved');
      load();
    });
  }

  async function respond(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const message = fd.get('message');
    if (!String(message || '').trim()) {
      setErrors({ message: 'Write a response for the student' });
      show.error('Write a response before sending');
      return;
    }
    setErrors({});
    await run(async () => {
      const res = await fetch(`/api/issues/${respondIssue._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, status: fd.get('status') }),
      });
      const data = await res.json();
      if (!res.ok) {
        show.error(data.error || 'Could not send the response');
        return;
      }
      setRespondIssue(null);
      show.success('Response sent');
      load();
    });
  }

  const highRisk = students.filter((s) => s.riskLevel === 'HIGH').length;
  const openIssues = issues.filter((i) => ['OPEN', 'IN_PROGRESS'].includes(i.status)).length;
  const now = Date.now();
  const upcoming = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const pastMeetings = meetings
    .filter((m) => new Date(m.scheduledAt).getTime() < now)
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));
  const draftMinutes = minutes.filter((m) => !m.finalized).length;
  const needsReply = issues.filter((i) => ['OPEN', 'IN_PROGRESS'].includes(i.status));

  return (
    <Shell role="MENTOR" name={me.name} nav={NAV}>
      <PageHead
        eyebrow="Faculty Mentor"
        title="Mentor Dashboard"
        subtitle="Mentees assigned by your HoD, plus credits, meetings, and issues."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <Stat label="My Mentees" value={students.length} />
        <Stat label="At Risk" value={highRisk} tone={highRisk ? 'red' : 'green'} />
        <Stat label="Open Issues" value={openIssues} tone={openIssues ? 'amber' : 'green'} />
        <Stat label="Draft Minutes" value={draftMinutes} tone={draftMinutes ? 'amber' : 'gray'} />
      </div>

      <TabBar>
        {[
          ['mentees', 'Mentees'],
          ['meetings', 'Meetings'],
          ['minutes', 'Minutes'],
          ['issues', `Issues${openIssues ? ` (${openIssues})` : ''}`],
        ].map(([k, l]) => (
          <Tab key={k} active={tab === k} onClick={() => setTab(k)}>{l}</Tab>
        ))}
      </TabBar>

      {tab === 'mentees' && (
        <Card
          title="Assigned mentees"
          subtitle="Students your HoD mapped to you. You cannot add students here."
          actions={(
            <span className="flex flex-wrap gap-2">
              <a className="btn-ghost !py-1.5 !px-3 text-xs" href="/api/reports/learners?format=xlsx">Learner Excel</a>
              <a className="btn-ghost !py-1.5 !px-3 text-xs" href="/api/reports/interactions">Interactions Excel</a>
            </span>
          )}
        >
          {students.length ? (
            <>
              {highRisk > 0 && (
                <div className="ui-callout-warn p-3 text-sm mb-4">
                  <span className="font-semibold">{highRisk}</span> mentee{highRisk > 1 ? 's are' : ' is'} marked high risk — prioritise a check-in.
                </div>
              )}
              <div className="space-y-2.5 md:hidden">
                {students.map((s) => (
                  <div key={s._id} className="ui-nest p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 text-brand font-bold text-sm flex items-center justify-center shrink-0">
                        {initials(s.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink truncate">{s.name}</div>
                        <div className="text-xs text-ink/45 mt-0.5">
                          {s.registrationNo}
                          {s.department?.name ? ` · ${s.department.name}` : ''}
                          {' · '}CGPA {s.latestCGPA ?? '—'} · {s.liveBacklogs ?? 0} backlog{(s.liveBacklogs || 0) === 1 ? '' : 's'}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {learnerBadge(learnerMap[s._id])}
                          <Badge tone={riskTone(s.riskLevel)}>{s.riskLevel || 'LOW'}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button type="button" className="btn-primary flex-1 !py-2" onClick={() => setWorkspace(s)}>Mentoring</button>
                      <button type="button" className="btn-ghost !py-2" onClick={() => setEditing(s)}>Profile</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="table-wrap hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="th">Student</th>
                      <th className="th">Department</th>
                      <th className="th">Programme</th>
                      <th className="th">CGPA</th>
                      <th className="th">Backlogs</th>
                      <th className="th">Learner</th>
                      <th className="th">Risk</th>
                      <th className="th" />
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s._id}>
                        <td className="td">
                          <div className="font-medium text-ink">{s.name}</div>
                          <div className="text-xs text-ink/40">{s.registrationNo}</div>
                        </td>
                        <td className="td">{s.department?.name || s.department?.code || '—'}</td>
                        <td className="td">{s.programme || '—'}</td>
                        <td className="td tabular-nums font-semibold">{s.latestCGPA ?? '—'}</td>
                        <td className="td tabular-nums">{s.liveBacklogs ?? 0}</td>
                        <td className="td">{learnerBadge(learnerMap[s._id])}</td>
                        <td className="td"><Badge tone={riskTone(s.riskLevel)}>{s.riskLevel}</Badge></td>
                        <td className="td whitespace-nowrap text-right">
                          <button type="button" className="btn-primary !py-1.5 !px-3 text-xs mr-1.5" onClick={() => setWorkspace(s)}>
                            Mentoring
                          </button>
                          <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => setEditing(s)}>
                            Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink/45 py-4 text-center">
              No mentees assigned yet. Your HoD adds students and maps them to you — they will show up here.
            </p>
          )}
        </Card>
      )}

      {tab === 'meetings' && (
        <div className="space-y-4">
          <Card
            title="Upcoming"
            subtitle="Meet links and invites are created when you schedule"
            actions={(
              <button type="button" className="btn-primary !py-2" onClick={() => setShowMeet(true)}>
                Schedule meeting
              </button>
            )}
          >
            {upcoming.length ? (
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div key={m._id} className="ui-nest p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{m.title}</div>
                      <div className="text-sm text-ink/55 mt-0.5">
                        {new Date(m.scheduledAt).toLocaleString()}
                        {' · '}
                        {(m.type || '').replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={statusTone(m.status)}>{m.status}</Badge>
                      {m.meetLink ? (
                        <a className="btn-primary !py-1.5 !px-3 text-xs" href={m.meetLink} target="_blank" rel="noreferrer">
                          Join
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-ink/45 mb-3">No upcoming meetings. Weekly ones may also auto-schedule.</p>
                <button type="button" className="btn-primary" onClick={() => setShowMeet(true)}>Schedule one</button>
              </div>
            )}
          </Card>

          <Card title="Past meetings">
            {pastMeetings.length ? (
              <div className="table-wrap">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="th">Title</th>
                      <th className="th">Type</th>
                      <th className="th">When</th>
                      <th className="th">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastMeetings.map((m) => (
                      <tr key={m._id}>
                        <td className="td font-medium">{m.title}</td>
                        <td className="td">{(m.type || '').replace(/_/g, ' ')}</td>
                        <td className="td">{new Date(m.scheduledAt).toLocaleString()}</td>
                        <td className="td"><Badge tone={statusTone(m.status)}>{m.status}</Badge></td>
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

      {tab === 'minutes' && (
        <Card
          title="Minutes of meetings"
          subtitle="Drafts open for editing — finalize when the record is complete for IQAC"
        >
          {minutes.length ? (
            <div className="space-y-2">
              {minutes.map((m) => (
                <div key={m._id} className="ui-nest p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{m.title}</div>
                    <div className="text-sm text-ink/50 mt-0.5">
                      {m.heldOn ? new Date(m.heldOn).toLocaleDateString() : 'Date TBD'}
                      {m.type ? ` · ${(m.type || '').replace(/_/g, ' ')}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.finalized ? <Badge tone="green">Finalized</Badge> : <Badge tone="amber">Draft</Badge>}
                    <button
                      type="button"
                      className={m.finalized ? 'btn-ghost !py-1.5 !px-3 text-xs' : 'btn-primary !py-1.5 !px-3 text-xs'}
                      onClick={() => setViewMin(m)}
                    >
                      {m.finalized ? 'View' : 'Edit'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/45 py-4 text-center">
              Minutes are created automatically when meetings are scheduled.
            </p>
          )}
        </Card>
      )}

      {tab === 'issues' && (
        <Card
          title="Mentee issues"
          subtitle="Reply clearly and keep status up to date"
        >
          {needsReply.length > 0 && (
            <div className="ui-callout-warn p-3 text-sm mb-4">
              <span className="font-semibold">{needsReply.length}</span> issue{needsReply.length > 1 ? 's' : ''} waiting for your response.
            </div>
          )}
          {issues.length ? (
            <div className="space-y-2.5">
              {issues.map((i) => (
                <div key={i._id} className="ui-nest p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-ink">{i.subject}</div>
                      <div className="text-xs text-ink/45 mt-0.5">
                        {i.student?.name || 'Student'}
                        {i.category ? ` · ${String(i.category).replace(/_/g, ' ')}` : ''}
                        {i.priority ? ` · ${i.priority}` : ''}
                      </div>
                    </div>
                    <Badge tone={statusTone(i.status)}>{i.status}</Badge>
                  </div>
                  {i.description && (
                    <p className="text-sm text-ink/65 mt-2 leading-relaxed line-clamp-2">{i.description}</p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <button type="button" className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => setRespondIssue(i)}>
                      Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/45 py-4 text-center">No issues raised by your mentees yet.</p>
          )}
        </Card>
      )}

      <Modal
        open={!!workspace}
        onClose={() => { setWorkspace(null); load(); }}
        title={workspace ? workspace.name : 'Mentoring'}
        description={workspace ? `${workspace.registrationNo || ''} · ${workspace.programme || 'Programme TBD'} · Sem ${workspace.currentSemester || '—'}` : undefined}
        wide
      >
        {workspace && (
          <MenteeWorkspace
            student={workspace}
            onClose={() => { setWorkspace(null); load(); }}
          />
        )}
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit profile — ${editing.name}` : ''}
        description="Update academics, placements, and mentoring fields."
        wide
      >
        {editing && (
          <ProfileEditor student={editing} onSave={saveProfile} onClose={() => setEditing(null)} />
        )}
      </Modal>

      <Modal
        open={showMeet}
        onClose={() => setShowMeet(false)}
        title="Schedule meeting"
        description="Creates a Meet link, emails invites, and drafts the minutes."
      >
        <form onSubmit={scheduleMeeting} className="ui-form-stack" noValidate>
          <Field label="Title" error={errors.title}>
            <input
              className="input"
              placeholder="Weekly mentoring — CSE batch"
              value={meetForm.title || ''}
              onChange={(e) => { setMeetForm({ ...meetForm, title: e.target.value }); setErrors((p) => ({ ...p, title: undefined })); }}
              disabled={busy}
            />
          </Field>
          <FieldGrid>
            <Field label="Type">
              <select
                className="input"
                value={meetForm.type}
                onChange={(e) => setMeetForm({ ...meetForm, type: e.target.value })}
                disabled={busy}
              >
                <option value="WEEKLY_MENTORING">Weekly mentoring (mentees)</option>
                <option value="MONTHLY_PARENT">Monthly parent meeting</option>
                <option value="ADHOC">Ad-hoc</option>
              </select>
            </Field>
            <Field label="Date & time" error={errors.scheduledAt}>
              <input
                className="input"
                type="datetime-local"
                value={meetForm.scheduledAt || ''}
                onChange={(e) => { setMeetForm({ ...meetForm, scheduledAt: e.target.value }); setErrors((p) => ({ ...p, scheduledAt: undefined })); }}
                disabled={busy}
              />
            </Field>
          </FieldGrid>
          <Field label="Agenda" hint="Optional — shown on the invite and minutes draft.">
            <textarea
              className="input"
              rows={2}
              placeholder="What will you cover in this session?"
              value={meetForm.agenda || ''}
              onChange={(e) => setMeetForm({ ...meetForm, agenda: e.target.value })}
              disabled={busy}
            />
          </Field>
          <SubmitButton loading={busy} loadingText="Scheduling…">Schedule & notify</SubmitButton>
        </form>
      </Modal>

      <Modal
        open={!!viewMin}
        onClose={() => setViewMin(null)}
        title="Minutes of meeting"
        description="Capture discussion so IQAC has a clean record later."
        wide
      >
        {viewMin && <MinutesEditor m={viewMin} onSave={saveMinutes} saving={busy} />}
      </Modal>

      <Modal
        open={!!respondIssue}
        onClose={() => setRespondIssue(null)}
        title="Respond to issue"
        description={respondIssue ? `${respondIssue.student?.name || 'Student'} · ${respondIssue.subject}` : undefined}
      >
        {respondIssue && (
          <div className="ui-form-stack">
            <div className="ui-nest-muted p-3.5 text-sm">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge tone={statusTone(respondIssue.status)}>{respondIssue.status}</Badge>
                {respondIssue.priority && <Badge tone="gray">{respondIssue.priority}</Badge>}
              </div>
              <p className="text-ink/70 leading-relaxed">{respondIssue.description}</p>
            </div>

            {(respondIssue.responses || []).length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-ink/45 mb-2">Thread</div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-0.5">
                  {(respondIssue.responses || []).map((r, i) => (
                    <div key={i} className="text-sm ui-callout-soft p-2.5">
                      <span className="font-semibold text-ink">{r.byName}</span>
                      {r.byRole ? <span className="text-ink/40 text-xs"> · {r.byRole}</span> : null}
                      <p className="mt-0.5 text-ink/75">{r.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={respond} className="ui-form-stack" noValidate>
              <Field label="Your response" error={errors.message}>
                <textarea
                  name="message"
                  className="input"
                  rows={3}
                  placeholder="What did you advise or decide?"
                  disabled={busy}
                  onChange={() => setErrors((p) => ({ ...p, message: undefined }))}
                />
              </Field>
              <Field label="Status">
                <select name="status" className="input" defaultValue={respondIssue.status} disabled={busy}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="ESCALATED">Escalated</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </Field>
              <SubmitButton loading={busy} loadingText="Sending…">Send response</SubmitButton>
            </form>
          </div>
        )}
      </Modal>
    </Shell>
  );
}

function MinutesEditor({ m, onSave, saving }) {
  const [f, setF] = useState({ ...m, actionItems: m.actionItems || [], attendees: m.attendees || [] });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const presentCount = f.attendees.filter((a) => a.present).length;

  return (
    <div className="ui-form-stack">
      <div className="rounded-xl bg-accent-mint/70 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Title</div>
          <div className="font-semibold text-ink">{f.title}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Held on</div>
          <div className="font-semibold text-ink">{f.heldOn ? new Date(f.heldOn).toLocaleString() : '—'}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Attendance</div>
          <div className="font-semibold text-ink">
            {presentCount}/{f.attendees.length || 0} present
          </div>
        </div>
        {f.finalized ? <Badge tone="green">Finalized</Badge> : <Badge tone="amber">Draft</Badge>}
      </div>

      <Field label="Attendance" hint="Tick who was present.">
        <div className="ui-nest max-h-44 overflow-y-auto divide-y divide-ink/8">
          {f.attendees.map((a, i) => (
            <label key={i} className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer hover:bg-cream/80">
              <input
                type="checkbox"
                className="rounded border-ink/25"
                checked={!!a.present}
                onChange={(e) => {
                  const arr = [...f.attendees];
                  arr[i] = { ...a, present: e.target.checked };
                  set('attendees', arr);
                }}
              />
              <span className="font-medium text-ink">{a.name}</span>
              <span className="text-ink/40 text-xs">{a.role}</span>
            </label>
          ))}
          {!f.attendees.length && (
            <div className="px-3 py-3 text-ink/40 text-sm">No attendees recorded.</div>
          )}
        </div>
      </Field>

      <Field label="Agenda" hint="Optional">
        <textarea
          className="input"
          rows={2}
          value={f.agenda || ''}
          placeholder="What was planned…"
          onChange={(e) => set('agenda', e.target.value)}
        />
      </Field>
      <Field label="Discussion">
        <textarea
          className="input"
          rows={4}
          value={f.discussion || ''}
          placeholder="Key points from the conversation…"
          onChange={(e) => set('discussion', e.target.value)}
        />
      </Field>
      <Field label="Decisions" hint="Optional">
        <textarea
          className="input"
          rows={2}
          value={f.decisions || ''}
          placeholder="What was agreed…"
          onChange={(e) => set('decisions', e.target.value)}
        />
      </Field>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <SubmitButton
          type="button"
          loading={saving}
          loadingText="Saving…"
          className="btn-primary hero-cta-shine flex-1 !py-2.5"
          onClick={() => onSave(f)}
        >
          Save draft
        </SubmitButton>
        {!f.finalized && (
          <button type="button" className="btn-ghost !py-2.5" disabled={saving} onClick={() => onSave({ ...f, finalize: true })}>
            Finalize
          </button>
        )}
        <button type="button" className="btn-ghost !py-2.5 no-print" onClick={() => window.print()}>
          Print
        </button>
      </div>
    </div>
  );
}
