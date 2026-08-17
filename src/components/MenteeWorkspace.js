'use client';
import { useEffect, useState } from 'react';
import { Field, Badge, Modal, TabBar, Tab, statusTone, useToast, useBusy, SubmitButton, requiredFields } from '@/components/ui';
import CreditTracker from '@/components/CreditTracker';

const KINDS = ['CREDIT_COUNSELLING', 'ACADEMIC', 'CAREER', 'PERSONAL', 'GENERAL'];
const kindLabel = (k) => (k || '').replace(/_/g, ' ');

export default function MenteeWorkspace({ student, onClose }) {
  const [tab, setTab] = useState('credit');
  const [data, setData] = useState(null);
  const [counsel, setCounsel] = useState([]);
  const [branch, setBranch] = useState([]);
  const [reviewGs, setReviewGs] = useState(null);
  const [busy, run] = useBusy();
  const { show } = useToast();

  async function load() {
    const [c, cn, br] = await Promise.all([
      fetch(`/api/credit/${student._id}`).then((r) => r.json()),
      fetch(`/api/counselling?studentId=${student._id}`).then((r) => r.json()),
      fetch(`/api/branch-change?studentId=${student._id}`).then((r) => r.json()),
    ]);
    setData(c);
    setCounsel(cn.records || []);
    setBranch(br.requests || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [student._id]);

  const baskets = data?.baskets || [];
  const gradesheets = data?.gradesheets || [];
  const firstYear = (student.currentSemester || 1) <= 2;
  const needsReview = gradesheets.filter((g) => g.status === 'NEEDS_REVIEW').length;

  async function requestGradesheet() {
    await run(async () => {
      const res = await fetch('/api/counselling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: student._id,
          kind: 'GRADESHEET_REQUEST',
          subject: 'Please upload your latest gradesheet',
          summary: 'Mentor requested the latest semester gradesheet for credit review.',
        }),
      });
      if (!res.ok) {
        show.error('Could not send the gradesheet request');
        return;
      }
      show.success('Gradesheet request sent to the student');
      load();
    });
  }

  async function verifyGs(gs, remaps) {
    await run(async () => {
      const res = await fetch(`/api/gradesheets/${gs._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remaps, status: 'VERIFIED' }),
      });
      const d = await res.json();
      if (!res.ok) {
        show.error(d.error || 'Could not verify the gradesheet');
        return;
      }
      setReviewGs(null);
      show.success('Gradesheet verified — credits updated');
      load();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 -mt-1">
        <p className="text-xs text-ink/50">
          Credits, gradesheets, counselling, and branch requests for this mentee.
        </p>
        <a
          className="btn-ghost !py-1.5 !px-3 text-xs no-print"
          href={`/api/reports/interactions?studentId=${student._id}`}
        >
          Interaction Excel
        </a>
      </div>

      <TabBar className="!mb-3">
        {[
          ['credit', 'Credits'],
          ['gradesheets', `Gradesheets${needsReview ? ` (${needsReview})` : gradesheets.length ? ` (${gradesheets.length})` : ''}`],
          ['counsel', `Counselling${counsel.length ? ` (${counsel.length})` : ''}`],
          ['branch', `Branch${branch.length ? ` (${branch.length})` : ''}`],
        ].map(([k, l]) => (
          <Tab key={k} active={tab === k} onClick={() => setTab(k)}>{l}</Tab>
        ))}
      </TabBar>

      {!data && <p className="text-ink/40 text-sm py-8 text-center">Loading mentee academics…</p>}

      {data && tab === 'credit' && (
        <div className="space-y-4">
          <LearningLevel student={student} learner={data.learner} onSaved={load} show={show} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink/50">Progress uses verified gradesheets only.</p>
            <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={requestGradesheet} disabled={busy}>
              {busy ? 'Sending…' : 'Ask for gradesheet'}
            </button>
          </div>
          <CreditTracker progress={data.progress} />
        </div>
      )}

      {data && tab === 'gradesheets' && (
        <GradesheetList gradesheets={gradesheets} onReview={setReviewGs} onAsk={requestGradesheet} />
      )}

      {data && tab === 'counsel' && (
        <CounsellingPanel
          studentId={student._id}
          baskets={baskets}
          records={counsel}
          recommendations={data.progress?.recommendations || []}
          onSaved={load}
          show={show}
        />
      )}

      {data && tab === 'branch' && (
        <BranchPanel student={student} firstYear={firstYear} requests={branch} onSaved={load} show={show} />
      )}

      {reviewGs && (
        <GradesheetReview
          gs={reviewGs}
          baskets={baskets}
          onClose={() => setReviewGs(null)}
          onVerify={verifyGs}
          saving={busy}
        />
      )}
    </div>
  );
}

function GradesheetList({ gradesheets, onReview, onAsk }) {
  if (!gradesheets.length) {
    return (
      <div className="ui-callout-warn p-4 text-sm">
        <div className="font-semibold text-ink">No gradesheets yet</div>
        <p className="text-ink/65 mt-1">Ask the student to upload a text PDF, then review basket mapping here.</p>
        <button type="button" className="btn-primary mt-3 !py-2" onClick={onAsk}>
          Ask student for gradesheet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {gradesheets.map((g) => (
        <div key={g._id} className="ui-nest p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold text-ink">{g.title}</div>
            <div className="text-xs text-ink/45 mt-0.5">
              Sem {g.semester ?? '—'} · {g.creditsEarnedTotal ?? 0} credits · {(g.parsedLines || []).length} courses
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone={g.status === 'VERIFIED' ? 'green' : g.status === 'NEEDS_REVIEW' ? 'amber' : 'blue'}>
              {g.status.replace(/_/g, ' ')}
            </Badge>
            <a
              className="btn-ghost !py-1.5 !px-3 text-xs"
              href={`/api/gradesheets/${g._id}/file`}
              target="_blank"
              rel="noreferrer"
            >
              PDF
            </a>
            <button
              type="button"
              className={g.status === 'VERIFIED' ? 'btn-ghost !py-1.5 !px-3 text-xs' : 'btn-primary !py-1.5 !px-3 text-xs'}
              onClick={() => onReview(g)}
            >
              {g.status === 'VERIFIED' ? 'View' : 'Review'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function GradesheetReview({ gs, baskets, onClose, onVerify, saving }) {
  const [lines, setLines] = useState(
    (gs.parsedLines || []).map((l) => ({ ...l, basket: l.basket ? String(l.basket) : '' }))
  );
  const set = (i, v) => setLines((p) => p.map((l, x) => (x === i ? { ...l, basket: v } : l)));
  const remaps = lines.map((l) => ({ lineId: l._id, basket: l.basket || null }));
  const unmapped = lines.filter((l) => !l.basket).length;

  return (
    <Modal
      open
      nested
      wide
      onClose={onClose}
      title={`Review — ${gs.title}`}
      description="Confirm each course’s basket. Fixes are remembered for future uploads. Only passing grades earn credit."
      footer={(
        <>
          <span className="text-xs text-ink/55 mr-auto self-center">
            {unmapped ? `${unmapped} course(s) still need a basket` : 'All courses mapped'}
          </span>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <SubmitButton
            type="button"
            className="btn-primary"
            loading={saving}
            loadingText="Verifying…"
            onClick={() => onVerify(gs, remaps)}
            disabled={!!unmapped}
          >
            Verify & apply credits
          </SubmitButton>
        </>
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <a
          className="text-brand font-semibold underline text-sm"
          href={`/api/gradesheets/${gs._id}/file`}
          target="_blank"
          rel="noreferrer"
        >
          Open original PDF
        </a>
        {unmapped > 0 && (
          <span className="text-xs font-medium text-ink/55">{unmapped} unmapped highlighted below</span>
        )}
      </div>
      {gs.parseWarning ? (
        <div className="ui-callout-warn text-ink text-xs p-2.5 mb-3">{gs.parseWarning}</div>
      ) : null}
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="th">Course</th>
              <th className="th">Title</th>
              <th className="th">Cr</th>
              <th className="th">Grade</th>
              <th className="th">Basket</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className={!l.basket ? 'bg-accent-yellow/80' : ''}>
                <td className="td font-mono text-xs">{l.courseCode}</td>
                <td className="td">{l.courseTitle}</td>
                <td className="td tabular-nums">{l.credit}</td>
                <td className="td">{l.passed ? l.grade : <Badge tone="red">{l.grade}</Badge>}</td>
                <td className="td min-w-[9rem]">
                  <select className="input !py-1.5 text-xs" value={l.basket} onChange={(e) => set(i, e.target.value)}>
                    <option value="">Select…</option>
                    {baskets.map((b) => (
                      <option key={b._id} value={String(b._id)}>{b.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {!lines.length && (
              <tr><td className="td text-ink/40" colSpan={5}>No course rows were parsed from this PDF.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function CounsellingPanel({ studentId, baskets, records, recommendations, onSaved, show }) {
  const blankRec = () => ({ basket: '', credits: '', suggestedCourses: '', targetSemester: '' });
  const [form, setForm] = useState({
    kind: 'CREDIT_COUNSELLING',
    mode: 'IN_PERSON',
    subject: '',
    summary: '',
    advice: '',
    recommendations: [],
  });
  const [errors, setErrors] = useState({});
  const [busy, run] = useBusy();
  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => (p[k] ? { ...p, [k]: undefined } : p));
  };

  function prefillFromTracker() {
    const recs = (recommendations || []).map((r) => ({
      basket: r.basket ? String(r.basket) : '',
      credits: r.creditsToTake || '',
      suggestedCourses: '',
      targetSemester: '',
    }));
    setForm((p) => ({
      ...p,
      kind: 'CREDIT_COUNSELLING',
      subject: 'Credit plan — subjects to take next',
      recommendations: recs.length ? recs : [blankRec()],
    }));
  }

  async function save(e) {
    e.preventDefault();
    const next = requiredFields({ subject: [form.subject, 'Enter a subject for this session'] });
    setErrors(next);
    if (Object.keys(next).length) {
      show.error('Please fill in the required fields');
      return;
    }
    await run(async () => {
      const payload = {
        ...form,
        student: studentId,
        recommendations: form.recommendations.filter((r) => r.basket || r.suggestedCourses || r.credits),
      };
      const res = await fetch('/api/counselling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        show.error(d.error || 'Could not save the counselling note');
        return;
      }
      setForm({
        kind: 'CREDIT_COUNSELLING',
        mode: 'IN_PERSON',
        subject: '',
        summary: '',
        advice: '',
        recommendations: [],
      });
      setErrors({});
      show.success('Counselling note recorded');
      onSaved();
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <form onSubmit={save} className="space-y-3 ui-nest-muted p-4" noValidate>
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-ink text-sm">New session</div>
          <button type="button" className="text-xs font-semibold text-brand underline" onClick={prefillFromTracker}>
            Pre-fill from tracker
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Type">
            <select className="input" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
              {KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}
            </select>
          </Field>
          <Field label="Mode">
            <select className="input" value={form.mode} onChange={(e) => set('mode', e.target.value)}>
              <option value="IN_PERSON">In person</option>
              <option value="ONLINE">Online</option>
              <option value="PHONE">Phone</option>
              <option value="EMAIL">Email</option>
            </select>
          </Field>
        </div>
        <Field label="Subject" error={errors.subject}>
          <input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} disabled={busy} />
        </Field>
        <Field label="What was discussed">
          <textarea className="input" rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </Field>
        <Field label="Advice given">
          <textarea className="input" rows={2} value={form.advice} onChange={(e) => set('advice', e.target.value)} />
        </Field>

        {form.kind === 'CREDIT_COUNSELLING' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label !mb-0">Subjects / credits to take</span>
              <button
                type="button"
                className="text-xs font-semibold text-brand underline"
                onClick={() => set('recommendations', [...form.recommendations, blankRec()])}
              >
                + Add row
              </button>
            </div>
            {form.recommendations.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                <select
                  className="input col-span-4 !py-1.5 text-xs"
                  value={r.basket}
                  onChange={(e) => set('recommendations', form.recommendations.map((x, y) => (y === i ? { ...x, basket: e.target.value } : x)))}
                >
                  <option value="">Basket…</option>
                  {baskets.map((b) => <option key={b._id} value={String(b._id)}>{b.name}</option>)}
                </select>
                <input
                  className="input col-span-2 !py-1.5 text-xs"
                  placeholder="cr"
                  value={r.credits}
                  onChange={(e) => set('recommendations', form.recommendations.map((x, y) => (y === i ? { ...x, credits: e.target.value } : x)))}
                />
                <input
                  className="input col-span-5 !py-1.5 text-xs"
                  placeholder="Course code(s)"
                  value={r.suggestedCourses}
                  onChange={(e) => set('recommendations', form.recommendations.map((x, y) => (y === i ? { ...x, suggestedCourses: e.target.value } : x)))}
                />
                <button
                  type="button"
                  className="col-span-1 text-ink/35 hover:text-brand text-lg leading-none"
                  onClick={() => set('recommendations', form.recommendations.filter((_, y) => y !== i))}
                  aria-label="Remove row"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <SubmitButton loading={busy} loadingText="Saving note…" className="btn-primary w-full !py-2.5">
          Save counselling record
        </SubmitButton>
      </form>

      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-ink/45 mb-2">History</div>
        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-0.5">
          {records.map((r) => (
            <div key={r._id} className="ui-nest p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="font-semibold text-sm text-ink">{r.subject || kindLabel(r.kind)}</div>
                <Badge tone={r.kind === 'BRANCH_CHANGE' ? 'blue' : r.kind === 'CREDIT_COUNSELLING' ? 'green' : 'gray'}>
                  {kindLabel(r.kind)}
                </Badge>
              </div>
              <div className="text-xs text-ink/40 mt-0.5">
                {new Date(r.occurredOn).toLocaleDateString()}
                {r.mode ? ` · ${r.mode.replace(/_/g, ' ')}` : ''}
                {r.studentAcknowledged ? ' · acknowledged' : ''}
              </div>
              {r.summary && <p className="text-sm text-ink/75 mt-2 leading-relaxed">{r.summary}</p>}
              {r.advice && (
                <p className="text-sm text-ink/60 mt-1">
                  <span className="font-semibold text-ink">Advice:</span> {r.advice}
                </p>
              )}
              {(r.recommendations || []).length > 0 && (
                <ul className="text-xs text-ink/55 mt-2 space-y-0.5">
                  {r.recommendations.map((x, i) => (
                    <li key={i}>
                      · {x.basketName || 'Basket'}: {x.credits || '?'} cr
                      {x.suggestedCourses ? ` — ${x.suggestedCourses}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {!records.length && <p className="text-ink/40 text-sm py-2">No counselling records yet.</p>}
        </div>
      </div>
    </div>
  );
}

function BranchPanel({ student, firstYear, requests, onSaved, show }) {
  const [counselId, setCounselId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [busy, run] = useBusy();

  async function counsel(reqId, recommends) {
    if (!String(remarks || '').trim()) {
      show.error('Add counselling remarks before you submit');
      return;
    }
    await run(async () => {
      const res = await fetch(`/api/branch-change/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'counsel', mentorRemarks: remarks, mentorRecommends: recommends }),
      });
      const d = await res.json();
      if (!res.ok) {
        show.error(d.error || 'Could not record counselling');
        return;
      }
      setCounselId(null);
      setRemarks('');
      show.success('Counselling recorded');
      onSaved();
    });
  }

  return (
    <div className="space-y-3">
      {!firstYear && (
        <div className="ui-callout-soft text-sm p-3.5">
          Branch change applies to first-year students (sem 1–2). This mentee is in semester{' '}
          <b>{student.currentSemester || '—'}</b>.
        </div>
      )}
      {requests.map((r) => (
        <div key={r._id} className="ui-nest p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="font-semibold text-ink text-sm">
              {r.currentProgramme || '—'} <span className="text-ink/30 font-normal">→</span>{' '}
              <span className="text-brand">{r.requestedProgramme}</span>
            </div>
            <Badge tone={statusTone(r.status)}>{r.status.replace(/_/g, ' ')}</Badge>
          </div>
          {r.reason && (
            <p className="text-sm text-ink/65 mt-2">
              <span className="font-semibold text-ink">Reason:</span> {r.reason}
            </p>
          )}
          <div className="text-xs text-ink/40 mt-1">
            Raised {new Date(r.createdAt).toLocaleDateString()} · CGPA at request: {r.currentCGPA ?? '—'}
          </div>
          {r.mentorRemarks && (
            <div className="text-sm mt-2 ui-callout-warn p-2.5">
              <b>Your counselling:</b> {r.mentorRemarks} — {r.mentorRecommends ? 'Recommended' : 'Not recommended'}
            </div>
          )}

          {r.status === 'REQUESTED' && (
            counselId === r._id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Counselling remarks — advise the student and record your assessment"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <SubmitButton type="button" loading={busy} loadingText="Saving…" className="btn-primary !py-2" onClick={() => counsel(r._id, true)}>
                    Counsel & recommend
                  </SubmitButton>
                  <button type="button" className="btn-ghost !py-2" disabled={busy} onClick={() => counsel(r._id, false)}>
                    Counsel & don’t recommend
                  </button>
                  <button type="button" className="btn-ghost !py-2" onClick={() => { setCounselId(null); setRemarks(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn-primary mt-3 !py-2" onClick={() => { setCounselId(r._id); setRemarks(''); }}>
                Counsel this request
              </button>
            )
          )}
          {['RECOMMENDED', 'NOT_RECOMMENDED'].includes(r.status) && (
            <p className="text-xs text-ink/50 mt-2">Awaiting HoD/Dean decision.</p>
          )}
          {['APPROVED', 'REJECTED'].includes(r.status) && r.decisionRemarks && (
            <p className="text-sm mt-2"><b>Decision:</b> {r.decisionRemarks}</p>
          )}
        </div>
      ))}
      {!requests.length && (
        <p className="text-ink/40 text-sm py-2">No branch-change requests from this mentee.</p>
      )}
    </div>
  );
}

function LearningLevel({ student, learner, onSaved, show }) {
  const [editing, setEditing] = useState(false);
  const [cat, setCat] = useState(learner?.category || 'AVERAGE');
  const [reason, setReason] = useState('');
  const [busy, run] = useBusy();
  const labels = { ADVANCED: 'Advanced', AVERAGE: 'Average', SLOW: 'Slow learner' };
  const badgeTone = { ADVANCED: 'blue', AVERAGE: 'gray', SLOW: 'amber' };

  async function saveOverride() {
    await run(async () => {
      const res = await fetch(`/api/students/${student._id}/learner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, reason }),
      });
      const d = await res.json();
      if (!res.ok) {
        show.error(d.error || 'Could not update learner level');
        return;
      }
      setEditing(false);
      setReason('');
      show.success('Learner level updated');
      onSaved();
    });
  }

  async function clearOverride() {
    await run(async () => {
      const res = await fetch(`/api/students/${student._id}/learner`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear: true }),
      });
      if (!res.ok) {
        show.error('Could not revert learner level');
        return;
      }
      setEditing(false);
      show.success('Reverted to automatic');
      onSaved();
    });
  }

  if (!learner) return null;

  return (
    <div className="rounded-xl bg-cream/90 border border-ink/8 px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-ink/45">Learning level</span>
          <Badge tone={badgeTone[learner.category] || 'gray'}>{labels[learner.category] || learner.category}</Badge>
          {learner.overridden && <span className="text-xs text-ink/45">mentor override</span>}
        </div>
        {!editing && (
          <button
            type="button"
            className="btn-ghost !py-1.5 !px-3 text-xs"
            onClick={() => { setEditing(true); setCat(learner.category); }}
          >
            Override
          </button>
        )}
      </div>
      {learner.usedDefaults && (
        <p className="text-xs text-brand-dark font-medium mt-1.5">
          Using default criteria — ask HoD to set the learner policy.
        </p>
      )}
      {learner.basis?.length > 0 && (
        <p className="text-xs text-ink/55 mt-1.5">Why: {learner.basis.join(' · ')}</p>
      )}
      {learner.actions?.length > 0 && (
        <p className="text-sm text-ink/70 mt-1.5">
          <span className="font-semibold text-ink">Suggested support:</span> {learner.actions.join(', ')}
        </p>
      )}
      {editing && (
        <div className="mt-3 space-y-2.5 pt-3 border-t border-ink/8">
          <TabBar className="!mb-0 !border-0 !p-0">
            {['ADVANCED', 'AVERAGE', 'SLOW'].map((k) => (
              <Tab key={k} active={cat === k} onClick={() => setCat(k)} className="!text-xs !py-2 !px-3">
                {labels[k]}
              </Tab>
            ))}
          </TabBar>
          <textarea
            className="input"
            rows={2}
            placeholder="Reason for the manual decision (kept on record)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <SubmitButton type="button" loading={busy} loadingText="Saving…" className="btn-primary !py-1.5 !px-3 text-xs" onClick={saveOverride}>
              Save override
            </SubmitButton>
            <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={clearOverride}>
              Revert to automatic
            </button>
            <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
