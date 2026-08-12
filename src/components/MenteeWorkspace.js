'use client';
import { useEffect, useState } from 'react';
import { Card, Field, Badge, statusTone, useToast } from '@/components/ui';
import CreditTracker from '@/components/CreditTracker';

const KINDS = ['CREDIT_COUNSELLING', 'ACADEMIC', 'CAREER', 'PERSONAL', 'GENERAL'];
const kindLabel = (k) => (k || '').replace(/_/g, ' ');

export default function MenteeWorkspace({ student, onClose }) {
  const [tab, setTab] = useState('credit');
  const [data, setData] = useState(null);          // /api/credit response
  const [counsel, setCounsel] = useState([]);
  const [branch, setBranch] = useState([]);
  const [reviewGs, setReviewGs] = useState(null);   // gradesheet under review
  const { show, node } = useToast();

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

  async function requestGradesheet() {
    const res = await fetch('/api/counselling', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student: student._id, kind: 'GRADESHEET_REQUEST', subject: 'Please upload your latest gradesheet', summary: 'Mentor requested the latest semester gradesheet for credit review.' }),
    });
    if (!res.ok) return show('Could not send request');
    show('Gradesheet request sent to student'); load();
  }

  async function verifyGs(gs, remaps) {
    const res = await fetch(`/api/gradesheets/${gs._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remaps, status: 'VERIFIED' }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setReviewGs(null); show('Gradesheet verified — credits updated'); load();
  }

  return (
    <div className="space-y-4">
      {/* header line */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-lg font-bold text-ink">{student.name}</div>
          <div className="text-xs text-ink/55">{student.registrationNo} · {student.programme || '—'} · Sem {student.currentSemester || '—'}</div>
        </div>
        <a className="btn-ghost no-print" href={`/api/reports/interactions?studentId=${student._id}`}>Download interaction report (Excel)</a>
      </div>

      <div className="flex flex-wrap gap-2 border-b-2 border-ink/15 pb-2">
        {[['credit', 'Credit Tracker'], ['gradesheets', `Gradesheets (${gradesheets.length})`], ['counsel', `Counselling (${counsel.length})`], ['branch', `Branch Change${branch.length ? ` (${branch.length})` : ''}`]].map(([k, l]) => (
          <button key={k} className={tab === k ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {!data && <div className="text-ink/40 text-sm py-6">Loading…</div>}

      {data && tab === 'credit' && (
        <div className="space-y-4">
          <LearningLevel student={student} learner={data.learner} onSaved={load} show={show} />
          <div className="flex justify-end"><button className="btn-ghost" onClick={requestGradesheet}>Ask student for gradesheet</button></div>
          <CreditTracker progress={data.progress} />
        </div>
      )}

      {data && tab === 'gradesheets' && (
        <GradesheetList gradesheets={gradesheets} onReview={setReviewGs} />
      )}

      {data && tab === 'counsel' && (
        <CounsellingPanel studentId={student._id} baskets={baskets} records={counsel} recommendations={data.progress?.recommendations || []} onSaved={load} show={show} />
      )}

      {data && tab === 'branch' && (
        <BranchPanel student={student} firstYear={firstYear} requests={branch} onSaved={load} show={show} />
      )}

      {reviewGs && (
        <GradesheetReview gs={reviewGs} baskets={baskets} onClose={() => setReviewGs(null)} onVerify={verifyGs} />
      )}
      {node}
    </div>
  );
}

/* ---------- Gradesheets ---------- */
function GradesheetList({ gradesheets, onReview }) {
  if (!gradesheets.length) {
    return <div className="text-sm text-ink/55 ui-callout-warn p-4">No gradesheets uploaded yet. Use “Ask student for gradesheet” on the Credit Tracker tab.</div>;
  }
  return (
    <div className="table-wrap"><table className="w-full text-sm">
      <thead><tr><th className="th">Title</th><th className="th">Sem</th><th className="th">Credits earned</th><th className="th">Courses</th><th className="th">Status</th><th className="th"></th></tr></thead>
      <tbody>
        {gradesheets.map((g) => (
          <tr key={g._id}>
            <td className="td font-medium">{g.title}</td>
            <td className="td">{g.semester ?? '—'}</td>
            <td className="td">{g.creditsEarnedTotal ?? 0}</td>
            <td className="td">{(g.parsedLines || []).length}</td>
            <td className="td"><Badge tone={g.status === 'VERIFIED' ? 'green' : g.status === 'NEEDS_REVIEW' ? 'amber' : 'blue'}>{g.status.replace('_', ' ')}</Badge></td>
            <td className="td"><button className="btn-ghost" onClick={() => onReview(g)}>Review</button></td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}

function GradesheetReview({ gs, baskets, onClose, onVerify }) {
  const [lines, setLines] = useState((gs.parsedLines || []).map((l) => ({ ...l, basket: l.basket ? String(l.basket) : '' })));
  const set = (i, v) => setLines((p) => p.map((l, x) => (x === i ? { ...l, basket: v } : l)));
  const remaps = lines.map((l) => ({ lineId: l._id, basket: l.basket || null }));
  const unmapped = lines.filter((l) => !l.basket).length;
  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4 no-print" onClick={onClose}>
      <div className="bg-[#FFFcf7] border border-ink/10 rounded-xl shadow-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-ink">Review — {gs.title}</div>
          <a className="text-brand font-semibold underline text-sm" href={`/api/gradesheets/${gs._id}/file`} target="_blank" rel="noreferrer">Open original PDF</a>
        </div>
        {gs.parseWarning && <div className="ui-callout-warn text-ink text-xs p-2 mb-2">{gs.parseWarning}</div>}
        <p className="text-xs text-ink/55 mb-3">Confirm each course’s basket. Auto-detected mappings are pre-filled; fix any marked “Select…”. Your corrections are remembered for future uploads. Only passing grades earn credit.</p>
        <table className="w-full text-sm">
          <thead><tr><th className="th">Course</th><th className="th">Title</th><th className="th">Cr</th><th className="th">Grade</th><th className="th">Basket</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className={!l.basket ? 'bg-accent-yellow' : ''}>
                <td className="td font-mono text-xs">{l.courseCode}</td>
                <td className="td">{l.courseTitle}</td>
                <td className="td">{l.credit}</td>
                <td className="td">{l.passed ? l.grade : <Badge tone="red">{l.grade}</Badge>}</td>
                <td className="td">
                  <select className="input py-1" value={l.basket} onChange={(e) => set(i, e.target.value)}>
                    <option value="">Select…</option>
                    {baskets.map((b) => <option key={b._id} value={String(b._id)}>{b.name}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!lines.length && <tr><td className="td text-ink/40" colSpan={5}>No course rows were parsed from this PDF.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="text-xs text-ink/55">{unmapped ? `${unmapped} course(s) still need a basket` : 'All courses mapped'}</div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={() => onVerify(gs, remaps)} disabled={!!unmapped}>Verify & apply credits</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Counselling (subject/credit advising) ---------- */
function CounsellingPanel({ studentId, baskets, records, recommendations, onSaved, show }) {
  const blankRec = () => ({ basket: '', credits: '', suggestedCourses: '', targetSemester: '' });
  const [form, setForm] = useState({ kind: 'CREDIT_COUNSELLING', mode: 'IN_PERSON', subject: '', summary: '', advice: '', recommendations: [] });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function prefillFromTracker() {
    const recs = (recommendations || []).map((r) => ({ basket: r.basket ? String(r.basket) : '', credits: r.creditsToTake || '', suggestedCourses: '', targetSemester: '' }));
    setForm((p) => ({ ...p, kind: 'CREDIT_COUNSELLING', subject: 'Credit plan — subjects to take next', recommendations: recs.length ? recs : [blankRec()] }));
  }

  async function save(e) {
    e.preventDefault();
    const payload = { ...form, student: studentId, recommendations: form.recommendations.filter((r) => r.basket || r.suggestedCourses || r.credits) };
    const res = await fetch('/api/counselling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setForm({ kind: 'CREDIT_COUNSELLING', mode: 'IN_PERSON', subject: '', summary: '', advice: '', recommendations: [] });
    show('Counselling note recorded'); onSaved();
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* New note */}
      <form onSubmit={save} className="space-y-3 ui-nest p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-ink text-sm">Record a counselling session</div>
          <button type="button" className="text-xs text-brand underline" onClick={prefillFromTracker}>Pre-fill from tracker</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Type"><select className="input" value={form.kind} onChange={(e) => set('kind', e.target.value)}>{KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}</select></Field>
          <Field label="Mode"><select className="input" value={form.mode} onChange={(e) => set('mode', e.target.value)}><option>IN_PERSON</option><option>ONLINE</option><option>PHONE</option><option>EMAIL</option></select></Field>
        </div>
        <Field label="Subject"><input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} required /></Field>
        <Field label="What was discussed"><textarea className="input" rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} /></Field>
        <Field label="Advice given"><textarea className="input" rows={2} value={form.advice} onChange={(e) => set('advice', e.target.value)} /></Field>

        {form.kind === 'CREDIT_COUNSELLING' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label">Subjects / credits to take</span>
              <button type="button" className="text-xs text-brand underline" onClick={() => set('recommendations', [...form.recommendations, blankRec()])}>+ Add row</button>
            </div>
            {form.recommendations.map((r, i) => (
              <div key={i} className="grid grid-cols-12 gap-1 items-center">
                <select className="input col-span-4 py-1" value={r.basket} onChange={(e) => set('recommendations', form.recommendations.map((x, y) => y === i ? { ...x, basket: e.target.value } : x))}>
                  <option value="">Basket…</option>
                  {baskets.map((b) => <option key={b._id} value={String(b._id)}>{b.name}</option>)}
                </select>
                <input className="input col-span-2 py-1" placeholder="cr" value={r.credits} onChange={(e) => set('recommendations', form.recommendations.map((x, y) => y === i ? { ...x, credits: e.target.value } : x))} />
                <input className="input col-span-5 py-1" placeholder="Suggested course code(s)" value={r.suggestedCourses} onChange={(e) => set('recommendations', form.recommendations.map((x, y) => y === i ? { ...x, suggestedCourses: e.target.value } : x))} />
                <button type="button" className="col-span-1 text-ink/40 hover:text-brand-dark" onClick={() => set('recommendations', form.recommendations.filter((_, y) => y !== i))}>×</button>
              </div>
            ))}
          </div>
        )}
        <button className="btn-primary w-full">Save counselling record</button>
      </form>

      {/* History */}
      <div className="space-y-2">
        <div className="font-semibold text-ink text-sm">History</div>
        <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
          {records.map((r) => (
            <div key={r._id} className="ui-nest p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{r.subject || kindLabel(r.kind)}</span>
                <Badge tone={r.kind === 'BRANCH_CHANGE' ? 'blue' : r.kind === 'CREDIT_COUNSELLING' ? 'green' : 'gray'}>{kindLabel(r.kind)}</Badge>
              </div>
              <div className="text-xs text-ink/40">{new Date(r.occurredOn).toLocaleDateString()} · {r.mode?.replace('_', ' ')} {r.studentAcknowledged && '· acknowledged'}</div>
              {r.summary && <div className="text-sm text-ink/80 mt-1">{r.summary}</div>}
              {r.advice && <div className="text-sm text-ink/65 mt-1"><b>Advice:</b> {r.advice}</div>}
              {(r.recommendations || []).length > 0 && (
                <ul className="text-xs text-ink/65 mt-1 list-disc pl-4">
                  {r.recommendations.map((x, i) => <li key={i}>{x.basketName || 'Basket'}: {x.credits || '?'} cr {x.suggestedCourses ? `— ${x.suggestedCourses}` : ''}</li>)}
                </ul>
              )}
            </div>
          ))}
          {!records.length && <div className="text-ink/40 text-sm">No counselling records yet.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Branch change counselling ---------- */
function BranchPanel({ student, firstYear, requests, onSaved, show }) {
  const [counselId, setCounselId] = useState(null);
  const [remarks, setRemarks] = useState('');

  async function counsel(reqId, recommends) {
    const res = await fetch(`/api/branch-change/${reqId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'counsel', mentorRemarks: remarks, mentorRecommends: recommends }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setCounselId(null); setRemarks(''); show('Counselling recorded'); onSaved();
  }

  return (
    <div className="space-y-3">
      {!firstYear && (
        <div className="ui-callout-soft text-ink/80 text-sm p-3">
          Branch change is only applicable to first-year students (semester 1–2). This mentee is in semester {student.currentSemester || '—'}.
        </div>
      )}
      {requests.map((r) => (
        <div key={r._id} className="ui-nest p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{r.currentProgramme || '—'} → <span className="text-brand">{r.requestedProgramme}</span></div>
            <Badge tone={statusTone(r.status)}>{r.status.replace('_', ' ')}</Badge>
          </div>
          {r.reason && <div className="text-sm text-ink/65 mt-1"><b>Student’s reason:</b> {r.reason}</div>}
          <div className="text-xs text-ink/40 mt-1">Raised {new Date(r.createdAt).toLocaleDateString()} · CGPA at request: {r.currentCGPA ?? '—'}</div>
          {r.mentorRemarks && <div className="text-sm mt-2 ui-callout-warn p-2"><b>Your counselling:</b> {r.mentorRemarks} — {r.mentorRecommends ? 'Recommended' : 'Not recommended'}</div>}

          {['REQUESTED'].includes(r.status) && (
            counselId === r._id ? (
              <div className="mt-3 space-y-2">
                <textarea className="input" rows={3} placeholder="Counselling remarks — advise the student and record your assessment" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={() => counsel(r._id, true)}>Counsel & recommend</button>
                  <button className="btn-danger" onClick={() => counsel(r._id, false)}>Counsel & don’t recommend</button>
                  <button className="btn-ghost" onClick={() => { setCounselId(null); setRemarks(''); }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="btn-ghost mt-3" onClick={() => { setCounselId(r._id); setRemarks(''); }}>Counsel this request</button>
            )
          )}
          {['RECOMMENDED', 'NOT_RECOMMENDED'].includes(r.status) && <div className="text-xs text-ink/55 mt-2">Awaiting HoD/Dean decision.</div>}
          {['APPROVED', 'REJECTED'].includes(r.status) && r.decisionRemarks && <div className="text-sm mt-2"><b>Decision:</b> {r.decisionRemarks}</div>}
        </div>
      ))}
      {!requests.length && <div className="text-ink/40 text-sm">No branch-change requests from this mentee.</div>}
    </div>
  );
}

/* ---------- Learning level (slow/advanced learner) ---------- */
function LearningLevel({ student, learner, onSaved, show }) {
  const [editing, setEditing] = useState(false);
  const [cat, setCat] = useState(learner?.category || 'AVERAGE');
  const [reason, setReason] = useState('');
  const tones = { ADVANCED: 'bg-accent-peach', AVERAGE: 'bg-cream', SLOW: 'bg-accent-yellow' };
  const labels = { ADVANCED: 'Advanced learner', AVERAGE: 'Average learner', SLOW: 'Slow learner' };
  const badgeTone = { ADVANCED: 'blue', AVERAGE: 'gray', SLOW: 'amber' };

  async function saveOverride() {
    const res = await fetch(`/api/students/${student._id}/learner`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: cat, reason }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setEditing(false); setReason(''); show('Learner level updated'); onSaved();
  }
  async function clearOverride() {
    const res = await fetch(`/api/students/${student._id}/learner`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clear: true }) });
    if (!res.ok) return show('Failed');
    setEditing(false); show('Reverted to automatic'); onSaved();
  }

  if (!learner) return null;
  return (
    <div className={`ui-nest p-4 ${tones[learner.category] || tones.AVERAGE}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-ink">Learning level:</span>
          <Badge tone={badgeTone[learner.category]}>{labels[learner.category]}</Badge>
          {learner.overridden && <span className="text-xs text-ink/55">(set by mentor)</span>}
          {learner.usedDefaults && <span className="text-xs text-brand-dark font-medium">· using default criteria — ask HoD to set the policy</span>}
        </div>
        {!editing && <button className="btn-ghost py-1" onClick={() => { setEditing(true); setCat(learner.category); }}>Override</button>}
      </div>
      {learner.basis?.length > 0 && (
        <div className="text-xs text-ink/65 mt-2">Why: {learner.basis.join(' · ')}</div>
      )}
      {learner.actions?.length > 0 && (
        <div className="text-sm text-ink/80 mt-2">
          <span className="font-medium">Suggested support: </span>{learner.actions.join(', ')}
        </div>
      )}
      {editing && (
        <div className="mt-3 space-y-2 ui-nest p-3">
          <div className="flex gap-2">
            {['ADVANCED', 'AVERAGE', 'SLOW'].map((k) => (
              <button key={k} className={cat === k ? 'btn-primary py-1' : 'btn-ghost py-1'} onClick={() => setCat(k)}>{labels[k]}</button>
            ))}
          </div>
          <textarea className="input" rows={2} placeholder="Reason for the manual decision (kept on record)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn-primary py-1" onClick={saveOverride}>Save override</button>
            <button className="btn-ghost py-1" onClick={clearOverride}>Revert to automatic</button>
            <button className="btn-ghost py-1" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
