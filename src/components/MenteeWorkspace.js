'use client';
import { useEffect, useState } from 'react';
import { Field, Badge, statusTone, useToast, Tabs, Btn, EmptyState, Spinner } from '@/components/ui';
import CreditTracker from '@/components/CreditTracker';

const KINDS = ['CREDIT_COUNSELLING', 'ACADEMIC', 'CAREER', 'PERSONAL', 'GENERAL'];
const kindLabel = (k) => (k || '').replace(/_/g, ' ');

export default function MenteeWorkspace({ student, onClose }) {
  const [tab, setTab] = useState('credit');
  const [data, setData] = useState(null);
  const [counsel, setCounsel] = useState([]);
  const [branch, setBranch] = useState([]);
  const [reviewGs, setReviewGs] = useState(null);
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
  const pendingGs = gradesheets.filter((g) => g.status !== 'VERIFIED').length;

  async function requestGradesheet() {
    const res = await fetch('/api/counselling', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student: student._id,
        kind: 'GRADESHEET_REQUEST',
        subject: 'Please upload your latest gradesheet',
        summary: 'Mentor requested the latest semester gradesheet for CBCS credit review.',
      }),
    });
    if (!res.ok) return show('Could not send request', { tone: 'error' });
    show('Gradesheet request sent to student', { tone: 'success' });
    load();
  }

  async function verifyGs(gs, remaps) {
    const res = await fetch(`/api/gradesheets/${gs._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remaps, status: 'VERIFIED' }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed', { tone: 'error' });
    setReviewGs(null);
    show('Gradesheet verified — credits updated in tracker', { tone: 'success' });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-gray-900 tracking-tight">{student.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {student.registrationNo} · {student.programme || '—'} · Sem {student.currentSemester || '—'}
          </div>
        </div>
        <a
          className="btn-primary no-print"
          href={`/api/reports/interactions?studentId=${student._id}`}
        >
          Download interaction report
        </a>
      </div>

      <Tabs
        tabs={[
          { key: 'credit', label: 'Credit Tracker' },
          { key: 'gradesheets', label: `Gradesheets${pendingGs ? ` (${pendingGs} pending)` : ''}` },
          { key: 'counsel', label: `Counselling (${counsel.length})` },
          { key: 'branch', label: `Branch Change${branch.length ? ` (${branch.length})` : ''}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {!data && (
        <div className="text-gray-500 text-sm py-8 flex items-center justify-center gap-2">
          <Spinner /> Loading mentoring workspace…
        </div>
      )}

      {data && tab === 'credit' && (
        <div className="space-y-4 animate-fade-up">
          <div className="flex flex-wrap gap-2 justify-end">
            <Btn variant="ghost" onClick={requestGradesheet}>Ask student for gradesheet</Btn>
            <Btn variant="ghost" onClick={() => setTab('counsel')}>Record credit counselling</Btn>
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
        <GradesheetReview gs={reviewGs} baskets={baskets} onClose={() => setReviewGs(null)} onVerify={verifyGs} />
      )}
      {node}
    </div>
  );
}

function GradesheetList({ gradesheets, onReview, onAsk }) {
  if (!gradesheets.length) {
    return (
      <EmptyState
        title="No gradesheets uploaded"
        description="Ask the student to upload their semester gradesheet PDF. You will map courses to CBCS baskets, then verify."
        action={<Btn onClick={onAsk}>Ask student for gradesheet</Btn>}
      />
    );
  }
  return (
    <div className="overflow-x-auto animate-fade-up">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="th">Title</th>
            <th className="th">Sem</th>
            <th className="th">Credits earned</th>
            <th className="th">Courses</th>
            <th className="th">Status</th>
            <th className="th"></th>
          </tr>
        </thead>
        <tbody>
          {gradesheets.map((g) => (
            <tr key={g._id}>
              <td className="td font-medium">{g.title}</td>
              <td className="td">{g.semester ?? '—'}</td>
              <td className="td">{g.creditsEarnedTotal ?? 0}</td>
              <td className="td">{(g.parsedLines || []).length}</td>
              <td className="td">
                <Badge tone={g.status === 'VERIFIED' ? 'green' : g.status === 'NEEDS_REVIEW' ? 'amber' : 'blue'}>
                  {g.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="td">
                <Btn variant="ghost" className="py-1" onClick={() => onReview(g)}>
                  {g.status === 'VERIFIED' ? 'Re-review' : 'Review & verify'}
                </Btn>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GradesheetReview({ gs, baskets, onClose, onVerify }) {
  const [lines, setLines] = useState((gs.parsedLines || []).map((l) => ({ ...l, basket: l.basket ? String(l.basket) : '' })));
  const [busy, setBusy] = useState(false);
  const set = (i, v) => setLines((p) => p.map((l, x) => (x === i ? { ...l, basket: v } : l)));
  const remaps = lines.map((l) => ({ lineId: l._id, basket: l.basket || null }));
  const unmapped = lines.filter((l) => !l.basket).length;

  async function submit() {
    setBusy(true);
    try { await onVerify(gs, remaps); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 no-print animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-5 animate-scale-in shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-gray-900">Review — {gs.title}</div>
          <a className="text-brand underline text-sm" href={`/api/gradesheets/${gs._id}/file`} target="_blank" rel="noreferrer">Open original PDF</a>
        </div>
        {gs.parseWarning && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg p-2 mb-2">{gs.parseWarning}</div>}
        <p className="text-xs text-gray-500 mb-3">
          Confirm each course’s CBCS basket. Corrections are remembered for future uploads. Only verified sheets update the official Credit Tracker.
        </p>
        <table className="w-full text-sm">
          <thead><tr><th className="th">Course</th><th className="th">Title</th><th className="th">Cr</th><th className="th">Grade</th><th className="th">Basket</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className={!l.basket ? 'bg-amber-50' : ''}>
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
            {!lines.length && <tr><td className="td text-gray-400" colSpan={5}>No course rows were parsed from this PDF.</td></tr>}
          </tbody>
        </table>
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="text-xs text-gray-500">{unmapped ? `${unmapped} course(s) still need a basket` : 'All courses mapped'}</div>
          <div className="flex gap-2">
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn loading={busy} onClick={submit} disabled={!!unmapped}>Verify & apply credits</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function CounsellingPanel({ studentId, baskets, records, recommendations, onSaved, show }) {
  const blankRec = () => ({ basket: '', credits: '', suggestedCourses: '', targetSemester: '' });
  const [form, setForm] = useState({ kind: 'CREDIT_COUNSELLING', mode: 'IN_PERSON', subject: '', summary: '', advice: '', recommendations: [] });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function prefillFromTracker() {
    const recs = (recommendations || []).map((r) => ({
      basket: r.basket ? String(r.basket) : '',
      credits: r.creditsToTake || '',
      suggestedCourses: '',
      targetSemester: '',
    }));
    const focus = (recommendations || []).map((r) => `${r.creditsToTake} cr in ${r.basketName}`).join('; ');
    setForm((p) => ({
      ...p,
      kind: 'CREDIT_COUNSELLING',
      subject: 'CBCS credit plan — subjects to take next',
      summary: focus ? `Tracker gaps: ${focus}` : p.summary,
      advice: 'Prioritise the baskets listed below so graduation stays on track under the Choice Based Credit System.',
      recommendations: recs.length ? recs : [blankRec()],
    }));
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        student: studentId,
        recommendations: form.recommendations.filter((r) => r.basket || r.suggestedCourses || r.credits),
      };
      const res = await fetch('/api/counselling', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (!res.ok) return show(d.error || 'Failed', { tone: 'error' });
      setForm({ kind: 'CREDIT_COUNSELLING', mode: 'IN_PERSON', subject: '', summary: '', advice: '', recommendations: [] });
      show('Counselling note recorded — student can acknowledge it', { tone: 'success' });
      onSaved();
    } finally { setBusy(false); }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 animate-fade-up">
      <form onSubmit={save} className="space-y-3 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold text-gray-800 text-sm">Record a counselling session</div>
          <button type="button" className="text-xs text-brand underline" onClick={prefillFromTracker}>Pre-fill from Credit Tracker</button>
        </div>
        <p className="text-xs text-gray-500">Use Credit Counselling to advise which basket credits / subjects to take next so the student finishes on time.</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Type"><select className="input" value={form.kind} onChange={(e) => set('kind', e.target.value)}>{KINDS.map((k) => <option key={k} value={k}>{kindLabel(k)}</option>)}</select></Field>
          <Field label="Mode"><select className="input" value={form.mode} onChange={(e) => set('mode', e.target.value)}><option>IN_PERSON</option><option>ONLINE</option><option>PHONE</option><option>EMAIL</option></select></Field>
        </div>
        <Field label="Subject"><input className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} required placeholder="e.g. Sem 7 electives & skill basket" /></Field>
        <Field label="What was discussed"><textarea className="input" rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Discussion notes…" /></Field>
        <Field label="Advice given"><textarea className="input" rows={2} value={form.advice} onChange={(e) => set('advice', e.target.value)} placeholder="Guidance for the student…" /></Field>

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
                <input className="input col-span-5 py-1" placeholder="Course codes e.g. CSE3101, CSE3205" value={r.suggestedCourses} onChange={(e) => set('recommendations', form.recommendations.map((x, y) => y === i ? { ...x, suggestedCourses: e.target.value } : x))} />
                <button type="button" className="col-span-1 text-gray-400 hover:text-red-600" onClick={() => set('recommendations', form.recommendations.filter((_, y) => y !== i))}>×</button>
              </div>
            ))}
            {!form.recommendations.length && (
              <button type="button" className="text-xs text-brand underline" onClick={prefillFromTracker}>Load remaining baskets from tracker</button>
            )}
          </div>
        )}
        <Btn type="submit" loading={busy} className="w-full">{busy ? 'Saving…' : 'Save counselling record'}</Btn>
      </form>

      <div className="space-y-2">
        <div className="font-semibold text-gray-800 text-sm">History</div>
        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
          {records.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-lg p-3 hover:border-brand/30 transition">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{r.subject || kindLabel(r.kind)}</span>
                <Badge tone={r.kind === 'BRANCH_CHANGE' ? 'blue' : r.kind === 'CREDIT_COUNSELLING' ? 'green' : 'gray'}>{kindLabel(r.kind)}</Badge>
              </div>
              <div className="text-xs text-gray-400">{new Date(r.occurredOn).toLocaleDateString()} · {(r.mode || '').replace('_', ' ')} {r.studentAcknowledged && '· acknowledged'}</div>
              {r.summary && <div className="text-sm text-gray-700 mt-1">{r.summary}</div>}
              {r.advice && <div className="text-sm text-gray-600 mt-1"><b>Advice:</b> {r.advice}</div>}
              {(r.recommendations || []).length > 0 && (
                <ul className="text-xs text-gray-600 mt-1 list-disc pl-4">
                  {r.recommendations.map((x, i) => (
                    <li key={i}>{x.basketName || 'Basket'}: {x.credits || '?'} cr {x.suggestedCourses ? `— ${x.suggestedCourses}` : ''}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {!records.length && <EmptyState title="No counselling records yet" description="Record credit or general mentoring sessions here." />}
        </div>
      </div>
    </div>
  );
}

function BranchPanel({ student, firstYear, requests, onSaved, show }) {
  const [counselId, setCounselId] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  async function counsel(reqId, recommends) {
    if (!remarks.trim()) return show('Add counselling remarks first', { tone: 'error' });
    setBusy(true);
    try {
      const res = await fetch(`/api/branch-change/${reqId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'counsel', mentorRemarks: remarks, mentorRecommends: recommends }),
      });
      const d = await res.json();
      if (!res.ok) return show(d.error || 'Failed', { tone: 'error' });
      setCounselId(null); setRemarks('');
      show('Branch-change counselling recorded', { tone: 'success' });
      onSaved();
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3 animate-fade-up">
      {!firstYear && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-sm rounded-lg p-3">
          Branch change applies only to first-year students (semester 1–2). This mentee is in semester {student.currentSemester || '—'}.
        </div>
      )}
      {requests.map((r) => (
        <div key={r._id} className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium">{r.currentProgramme || '—'} → <span className="text-brand">{r.requestedProgramme}</span></div>
            <Badge tone={statusTone(r.status)}>{r.status.replace(/_/g, ' ')}</Badge>
          </div>
          {r.reason && <div className="text-sm text-gray-600 mt-1"><b>Student’s reason:</b> {r.reason}</div>}
          <div className="text-xs text-gray-400 mt-1">Raised {new Date(r.createdAt).toLocaleDateString()} · CGPA at request: {r.currentCGPA ?? '—'}</div>
          {r.mentorRemarks && (
            <div className="text-sm mt-2 bg-brand-light rounded-lg p-2">
              <b>Your counselling:</b> {r.mentorRemarks} — {r.mentorRecommends ? 'Recommended' : 'Not recommended'}
            </div>
          )}

          {r.status === 'REQUESTED' && (
            counselId === r._id ? (
              <div className="mt-3 space-y-2">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Counsel the student on academic impact, credit transfer, and career fit…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Btn loading={busy} onClick={() => counsel(r._id, true)}>Counsel & recommend</Btn>
                  <Btn variant="danger" loading={busy} onClick={() => counsel(r._id, false)}>Counsel & don’t recommend</Btn>
                  <Btn variant="ghost" onClick={() => { setCounselId(null); setRemarks(''); }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <Btn variant="ghost" className="mt-3" onClick={() => { setCounselId(r._id); setRemarks(''); }}>Counsel this request</Btn>
            )
          )}
          {['RECOMMENDED', 'NOT_RECOMMENDED', 'COUNSELLED'].includes(r.status) && (
            <div className="text-xs text-gray-500 mt-2">Awaiting HoD/Dean decision.</div>
          )}
          {['APPROVED', 'REJECTED'].includes(r.status) && r.decisionRemarks && (
            <div className="text-sm mt-2"><b>Decision:</b> {r.decisionRemarks}</div>
          )}
        </div>
      ))}
      {!requests.length && (
        <EmptyState
          title="No branch-change requests"
          description={firstYear ? 'If this first-year mentee requests a branch change, counsel them here before HoD decides.' : 'Only first-year students (sem 1–2) can raise branch-change requests.'}
        />
      )}
    </div>
  );
}
