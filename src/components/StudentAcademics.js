'use client';
import { useEffect, useState } from 'react';
import { Card, Field, Badge, Modal, statusTone } from '@/components/ui';
import CreditTracker from '@/components/CreditTracker';

export default function StudentAcademics({ student, show }) {
  const [data, setData] = useState(null);
  const [gradesheets, setGradesheets] = useState([]);
  const [requests, setRequests] = useState([]);
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
    await fetch(`/api/counselling/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentAcknowledged: true }),
    });
    show('Acknowledged');
    load();
  }

  async function submitBranch(e) {
    e.preventDefault();
    const res = await fetch('/api/branch-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branchForm),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setShowBranch(false);
    setBranchForm({ requestedProgramme: '', reason: '' });
    show('Branch-change request submitted');
    load();
  }

  async function withdrawBranch(id) {
    await fetch(`/api/branch-change/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'withdraw' }),
    });
    show('Request withdrawn');
    load();
  }

  if (!student) {
    return (
      <Card title="Credits & counselling">
        <p className="text-ink/45 text-sm">Your profile has not been set up yet. Please contact your HoD.</p>
      </Card>
    );
  }

  const hasOpenBranch = branch.some((b) =>
    ['REQUESTED', 'COUNSELLED', 'RECOMMENDED', 'NOT_RECOMMENDED'].includes(b.status)
  );

  return (
    <div className="space-y-5">
      {requests.length > 0 && (
        <div className="ui-callout-warn p-3.5 text-sm text-ink">
          <div className="font-semibold">Gradesheet requested</div>
          <p className="mt-0.5 text-ink/70">
            Your mentor asked you to upload your latest gradesheet. Use the upload form below.
          </p>
        </div>
      )}

      <Card title="Credit progress" subtitle="CBCS baskets vs your verified gradesheets">
        <CreditTracker progress={data?.progress} />
      </Card>

      <Card title="Gradesheets">
        <form onSubmit={doUpload} className="ui-nest-muted p-3.5 mb-4 space-y-3">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="label">PDF file</label>
              <input
                className="input"
                type="file"
                accept="application/pdf"
                onChange={(e) => setUpload({ ...upload, file: e.target.files[0] })}
              />
            </div>
            <Field label="Semester (optional)">
              <input
                className="input"
                type="number"
                min={1}
                max={12}
                placeholder="e.g. 3"
                value={upload.semester}
                onChange={(e) => setUpload({ ...upload, semester: e.target.value })}
              />
            </Field>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Uploading…' : 'Upload & parse'}
            </button>
          </div>
          <p className="text-xs text-ink/50 leading-relaxed">
            Use a text-based PDF (not a photo scan). Courses map to CBCS baskets; your mentor verifies before credits count.
          </p>
        </form>

        {gradesheets.length ? (
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Title</th>
                  <th className="th">Sem</th>
                  <th className="th">Credits</th>
                  <th className="th">Status</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {gradesheets.map((g) => (
                  <tr key={g._id}>
                    <td className="td font-medium">{g.title}</td>
                    <td className="td">{g.semester ?? '—'}</td>
                    <td className="td tabular-nums">{g.creditsEarnedTotal ?? 0}</td>
                    <td className="td">
                      <Badge tone={g.status === 'VERIFIED' ? 'green' : g.status === 'NEEDS_REVIEW' ? 'amber' : 'blue'}>
                        {g.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="td">
                      <a
                        className="text-brand font-semibold underline text-sm"
                        href={`/api/gradesheets/${g._id}/file`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink/45 py-1">No gradesheets uploaded yet.</p>
        )}
      </Card>

      <Card title="From your mentor">
        <div className="space-y-4">
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wide text-ink/45 mb-2">Counselling notes</h4>
            {counsel.length ? (
              <div className="space-y-2">
                {counsel.map((r) => (
                  <div key={r._id} className="ui-nest p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-ink">
                          {r.subject || r.kind.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-ink/40 mt-0.5">
                          {new Date(r.occurredOn).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge tone={r.kind === 'CREDIT_COUNSELLING' ? 'green' : r.kind === 'BRANCH_CHANGE' ? 'blue' : 'gray'}>
                        {r.kind.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    {r.summary && <p className="text-sm text-ink/75 mt-2 leading-relaxed">{r.summary}</p>}
                    {r.advice && (
                      <p className="text-sm text-ink/65 mt-1.5">
                        <span className="font-semibold text-ink">Advice:</span> {r.advice}
                      </p>
                    )}
                    {(r.recommendations || []).length > 0 && (
                      <ul className="text-xs text-ink/60 mt-2 space-y-0.5">
                        {r.recommendations.map((x, i) => (
                          <li key={i}>
                            · {x.basketName || 'Basket'}: {x.credits || '?'} cr
                            {x.suggestedCourses ? ` — ${x.suggestedCourses}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2.5">
                      {!r.studentAcknowledged ? (
                        <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => acknowledge(r._id)}>
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-ink/45">Acknowledged</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/45">No counselling notes yet.</p>
            )}
          </section>

          <div className="border-t border-ink/8 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-ink/45">Branch change</h4>
              {firstYear && !hasOpenBranch && (
                <button type="button" className="btn-ghost !py-1.5 !px-3 text-xs" onClick={() => setShowBranch(true)}>
                  Request change
                </button>
              )}
            </div>
            {!firstYear && (
              <p className="text-sm text-ink/50">Available only in first year (semester 1–2).</p>
            )}
            {firstYear && !branch.length && (
              <p className="text-sm text-ink/45">
                No request yet. If you want to change branch, raise one — your mentor counsels you first.
              </p>
            )}
            <div className="space-y-2">
              {branch.map((b) => (
                <div key={b._id} className="ui-nest p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-ink">
                      {b.currentProgramme || '—'}{' '}
                      <span className="text-ink/35 font-normal">→</span>{' '}
                      <span className="text-brand">{b.requestedProgramme}</span>
                    </div>
                    <Badge tone={statusTone(b.status)}>{b.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  {b.reason && <p className="text-sm text-ink/65 mt-1.5">{b.reason}</p>}
                  {b.mentorRemarks && (
                    <div className="text-sm mt-2 ui-callout-warn p-2">
                      <b>Mentor:</b> {b.mentorRemarks} — {b.mentorRecommends ? 'Recommended' : 'Not recommended'}
                    </div>
                  )}
                  {b.decisionRemarks && (
                    <p className="text-sm mt-1.5">
                      <b>Decision:</b> {b.decisionRemarks}
                    </p>
                  )}
                  {b.status === 'REQUESTED' && (
                    <button type="button" className="btn-ghost mt-2 !py-1.5 !px-3 text-xs" onClick={() => withdrawBranch(b._id)}>
                      Withdraw
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Modal
        open={showBranch}
        onClose={() => setShowBranch(false)}
        title="Request Branch Change"
        description="Your mentor will counsel you before the HoD/Dean takes a decision."
      >
        <form onSubmit={submitBranch} className="ui-form-stack">
          <Field label="Requested programme / branch">
            <input
              className="input"
              required
              value={branchForm.requestedProgramme}
              onChange={(e) => setBranchForm({ ...branchForm, requestedProgramme: e.target.value })}
            />
          </Field>
          <Field label="Reason">
            <textarea
              className="input"
              rows={3}
              value={branchForm.reason}
              onChange={(e) => setBranchForm({ ...branchForm, reason: e.target.value })}
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1">Submit request</button>
            <button type="button" className="btn-ghost" onClick={() => setShowBranch(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
