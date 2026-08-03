'use client';
import { useEffect, useState } from 'react';
import { Card, Field, Badge, statusTone } from '@/components/ui';
import CreditTracker from '@/components/CreditTracker';

export default function StudentAcademics({ student, show }) {
  const [data, setData] = useState(null);        // /api/credit
  const [gradesheets, setGradesheets] = useState([]);
  const [requests, setRequests] = useState([]);  // open gradesheet requests (counselling)
  const [counsel, setCounsel] = useState([]);
  const [branch, setBranch] = useState([]);
  const [upload, setUpload] = useState({ file: null, semester: '', title: '' });
  const [busy, setBusy] = useState(false);
  const [showBranch, setShowBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({ requestedProgramme: '', reason: '' });

  const sid = student?._id;
  const firstYear = (student?.currentSemester || 1) <= 2;

  async function load() {
    if (!sid) return;
    const [c, cn, br] = await Promise.all([
      fetch(`/api/credit/${sid}`).then((r) => r.json()),
      fetch(`/api/counselling?studentId=${sid}`).then((r) => r.json()),
      fetch(`/api/branch-change?studentId=${sid}`).then((r) => r.json()),
    ]);
    setData(c);
    setGradesheets(c.gradesheets || []);
    const recs = cn.records || [];
    setCounsel(recs.filter((r) => r.kind !== 'GRADESHEET_REQUEST'));
    setRequests(recs.filter((r) => r.kind === 'GRADESHEET_REQUEST' && r.requestStatus === 'OPEN'));
    setBranch(br.requests || []);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [sid]);

  async function doUpload(e) {
    e.preventDefault();
    if (!upload.file) return show('Choose a PDF');
    setBusy(true);
    const fd = new FormData();
    fd.append('file', upload.file);
    fd.append('studentId', sid);
    if (upload.semester) fd.append('semester', upload.semester);
    if (upload.title) fd.append('title', upload.title);
    if (requests[0]) fd.append('requestId', requests[0]._id);
    const res = await fetch('/api/gradesheets', { method: 'POST', body: fd });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) return show(d.error || 'Upload failed');
    setUpload({ file: null, semester: '', title: '' });
    show(d.warning ? 'Uploaded — some rows need mentor review' : 'Gradesheet uploaded & parsed');
    load();
  }

  async function acknowledge(id) {
    await fetch(`/api/counselling/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentAcknowledged: true }) });
    show('Acknowledged'); load();
  }

  async function submitBranch(e) {
    e.preventDefault();
    const res = await fetch('/api/branch-change', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(branchForm) });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setShowBranch(false); setBranchForm({ requestedProgramme: '', reason: '' }); show('Branch-change request submitted'); load();
  }

  async function withdrawBranch(id) {
    await fetch(`/api/branch-change/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'withdraw' }) });
    show('Request withdrawn'); load();
  }

  if (!student) return <Card title="Credits"><p className="text-gray-400 text-sm">Your profile has not been set up yet.</p></Card>;

  const hasOpenBranch = branch.some((b) => ['REQUESTED', 'COUNSELLED', 'RECOMMENDED', 'NOT_RECOMMENDED'].includes(b.status));

  return (
    <div className="space-y-4">
      {/* pending request banner */}
      {requests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
          Your mentor has asked you to upload your latest gradesheet. Please upload the PDF below.
        </div>
      )}

      {/* Credit tracker */}
      <Card title="Credit Tracker (CBCS)">
        <CreditTracker progress={data?.progress} />
      </Card>

      {/* Gradesheet upload + list */}
      <Card title="My Gradesheets">
        <form onSubmit={doUpload} className="grid md:grid-cols-4 gap-2 items-end mb-4">
          <div className="md:col-span-2">
            <label className="label">Gradesheet PDF</label>
            <input className="input" type="file" accept="application/pdf" onChange={(e) => setUpload({ ...upload, file: e.target.files[0] })} />
          </div>
          <Field label="Semester"><input className="input" type="number" value={upload.semester} onChange={(e) => setUpload({ ...upload, semester: e.target.value })} /></Field>
          <button className="btn-primary" disabled={busy}>{busy ? 'Uploading…' : 'Upload & parse'}</button>
        </form>
        <p className="text-xs text-gray-500 mb-3">Upload a text-based PDF (not a scanned image). The system reads your courses, credits and grades, and maps them to CBCS baskets. Your mentor verifies the mapping.</p>
        <table className="w-full text-sm">
          <thead><tr><th className="th">Title</th><th className="th">Sem</th><th className="th">Credits earned</th><th className="th">Status</th><th className="th"></th></tr></thead>
          <tbody>
            {gradesheets.map((g) => (
              <tr key={g._id}>
                <td className="td font-medium">{g.title}</td>
                <td className="td">{g.semester ?? '—'}</td>
                <td className="td">{g.creditsEarnedTotal ?? 0}</td>
                <td className="td"><Badge tone={g.status === 'VERIFIED' ? 'green' : g.status === 'NEEDS_REVIEW' ? 'amber' : 'blue'}>{g.status.replace('_', ' ')}</Badge></td>
                <td className="td"><a className="text-brand underline" href={`/api/gradesheets/${g._id}/file`} target="_blank" rel="noreferrer">PDF</a></td>
              </tr>
            ))}
            {!gradesheets.length && <tr><td className="td text-gray-400" colSpan={5}>No gradesheets uploaded yet.</td></tr>}
          </tbody>
        </table>
      </Card>

      {/* Counselling notes */}
      <Card title="Counselling from my Mentor">
        <div className="space-y-2">
          {counsel.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{r.subject || r.kind.replace(/_/g, ' ')}</span>
                <Badge tone={r.kind === 'CREDIT_COUNSELLING' ? 'green' : r.kind === 'BRANCH_CHANGE' ? 'blue' : 'gray'}>{r.kind.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="text-xs text-gray-400">{new Date(r.occurredOn).toLocaleDateString()}</div>
              {r.summary && <div className="text-sm text-gray-700 mt-1">{r.summary}</div>}
              {r.advice && <div className="text-sm text-gray-600 mt-1"><b>Advice:</b> {r.advice}</div>}
              {(r.recommendations || []).length > 0 && (
                <ul className="text-xs text-gray-600 mt-1 list-disc pl-4">
                  {r.recommendations.map((x, i) => <li key={i}>{x.basketName || 'Basket'}: {x.credits || '?'} cr {x.suggestedCourses ? `— ${x.suggestedCourses}` : ''}</li>)}
                </ul>
              )}
              {!r.studentAcknowledged
                ? <button className="btn-ghost mt-2 py-1" onClick={() => acknowledge(r._id)}>Acknowledge</button>
                : <div className="text-xs text-green-600 mt-1">✓ Acknowledged</div>}
            </div>
          ))}
          {!counsel.length && <p className="text-gray-400 text-sm">No counselling records yet.</p>}
        </div>
      </Card>

      {/* Branch change (first year only) */}
      <Card title="Branch Change" actions={firstYear && !hasOpenBranch ? <button className="btn-primary" onClick={() => setShowBranch(true)}>Request branch change</button> : null}>
        {!firstYear && <p className="text-gray-500 text-sm">Branch change is available only to first-year students (semester 1–2).</p>}
        {firstYear && !branch.length && <p className="text-gray-400 text-sm">No branch-change request placed. If you wish to change your branch, raise a request — your mentor will counsel you first.</p>}
        <div className="space-y-2">
          {branch.map((b) => (
            <div key={b._id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{b.currentProgramme || '—'} → <span className="text-brand">{b.requestedProgramme}</span></div>
                <Badge tone={statusTone(b.status)}>{b.status.replace('_', ' ')}</Badge>
              </div>
              {b.reason && <div className="text-sm text-gray-600 mt-1">{b.reason}</div>}
              {b.mentorRemarks && <div className="text-sm mt-2 bg-brand-light rounded p-2"><b>Mentor:</b> {b.mentorRemarks} — {b.mentorRecommends ? 'Recommended' : 'Not recommended'}</div>}
              {b.decisionRemarks && <div className="text-sm mt-1"><b>Decision:</b> {b.decisionRemarks}</div>}
              {['REQUESTED'].includes(b.status) && <button className="btn-ghost mt-2 py-1" onClick={() => withdrawBranch(b._id)}>Withdraw</button>}
            </div>
          ))}
        </div>
      </Card>

      {showBranch && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowBranch(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold mb-3">Request Branch Change</div>
            <form onSubmit={submitBranch} className="space-y-3">
              <Field label="Requested programme / branch"><input className="input" required value={branchForm.requestedProgramme} onChange={(e) => setBranchForm({ ...branchForm, requestedProgramme: e.target.value })} /></Field>
              <Field label="Reason"><textarea className="input" rows={3} value={branchForm.reason} onChange={(e) => setBranchForm({ ...branchForm, reason: e.target.value })} /></Field>
              <p className="text-xs text-gray-500">Your mentor will counsel you before the HoD/Dean takes a decision.</p>
              <div className="flex gap-2">
                <button className="btn-primary flex-1">Submit request</button>
                <button type="button" className="btn-ghost" onClick={() => setShowBranch(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
