'use client';
import { useEffect, useState } from 'react';
import { Card, Field, Badge } from '@/components/ui';

/* ============ Basket manager (HoD) ============ */
export function BasketManager({ show }) {
  const [baskets, setBaskets] = useState([]);
  const [form, setForm] = useState(blank());
  const [editingId, setEditingId] = useState(null);

  function blank() { return { name: '', code: '', defaultCredits: '', aliases: '', order: '', description: '' }; }

  async function load() {
    const d = await fetch('/api/baskets').then((r) => r.json());
    setBaskets(d.baskets || []);
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `/api/baskets/${editingId}` : '/api/baskets';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setForm(blank()); setEditingId(null); show(editingId ? 'Basket updated' : 'Basket added'); load();
  }

  async function remove(id) {
    if (!confirm('Remove this basket? Historical records keep their labels.')) return;
    await fetch(`/api/baskets/${id}`, { method: 'DELETE' });
    show('Basket removed'); load();
  }

  function edit(b) {
    setEditingId(b._id);
    setForm({ name: b.name, code: b.code || '', defaultCredits: b.defaultCredits || '', aliases: (b.aliases || []).join(', '), order: b.order || '', description: b.description || '' });
  }

  return (
    <Card title="CBCS Baskets" actions={<span className="text-xs text-gray-500">Define the credit buckets used across your department</span>}>
      <div className="grid md:grid-cols-2 gap-5">
        <form onSubmit={save} className="space-y-3 border border-gray-200 rounded-xl p-4">
          <div className="font-semibold text-sm text-gray-800">{editingId ? 'Edit basket' : 'Add a basket'}</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name *"><input className="input" placeholder="Program Core" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Code"><input className="input" placeholder="PC" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label="Default credits"><input className="input" type="number" value={form.defaultCredits} onChange={(e) => setForm({ ...form, defaultCredits: e.target.value })} /></Field>
            <Field label="Display order"><input className="input" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} /></Field>
          </div>
          <Field label="Aliases (comma-separated)"><input className="input" placeholder="Core, Discipline Core" value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} /></Field>
          <p className="text-xs text-gray-500">Aliases help the gradesheet reader recognise this basket when the PDF prints a different label.</p>
          <div className="flex gap-2">
            <button className="btn-primary flex-1">{editingId ? 'Save changes' : 'Add basket'}</button>
            {editingId && <button type="button" className="btn-ghost" onClick={() => { setEditingId(null); setForm(blank()); }}>Cancel</button>}
          </div>
        </form>

        <div>
          <div className="font-semibold text-sm text-gray-800 mb-2">Baskets ({baskets.length})</div>
          <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
            {baskets.map((b) => (
              <div key={b._id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{b.name} {b.code && <span className="text-gray-400">({b.code})</span>}</div>
                  <div className="text-xs text-gray-400">Default {b.defaultCredits || 0} cr{b.aliases?.length ? ` · aliases: ${b.aliases.join(', ')}` : ''}</div>
                </div>
                <div className="flex gap-1">
                  <button className="btn-ghost py-1" onClick={() => edit(b)}>Edit</button>
                  <button className="text-gray-400 hover:text-red-600 px-2" onClick={() => remove(b._id)}>×</button>
                </div>
              </div>
            ))}
            {!baskets.length && <div className="text-gray-400 text-sm">No baskets yet. Add your first basket to enable credit tracking.</div>}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ============ Per-student credit plan (HoD) ============ */
export function CreditPlanEditor({ student, onClose, show }) {
  const [baskets, setBaskets] = useState([]);
  const [lines, setLines] = useState([]);
  const [meta, setMeta] = useState({ creditsPerSemester: 20, expectedSemesters: 8 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [bs, pl] = await Promise.all([
        fetch('/api/baskets').then((r) => r.json()),
        fetch(`/api/credit-plan/${student._id}`).then((r) => r.json()),
      ]);
      const bl = bs.baskets || [];
      setBaskets(bl);
      const plan = pl.plan;
      if (plan?.lines?.length) {
        setLines(plan.lines.map((l) => ({ basket: String(l.basket || ''), basketName: l.basketName, requiredCredits: l.requiredCredits })));
        setMeta({ creditsPerSemester: plan.creditsPerSemester || 20, expectedSemesters: plan.expectedSemesters || 8 });
      } else {
        // seed from basket defaults
        setLines(bl.map((b) => ({ basket: String(b._id), basketName: b.name, requiredCredits: b.defaultCredits || 0 })));
      }
      setLoaded(true);
    })();
  }, [student._id]);

  const total = lines.reduce((a, l) => a + (Number(l.requiredCredits) || 0), 0);
  const setLine = (i, v) => setLines((p) => p.map((l, x) => (x === i ? { ...l, requiredCredits: v } : l)));

  async function save() {
    const res = await fetch(`/api/credit-plan/${student._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lines: lines.map((l) => ({ basket: l.basket, basketName: l.basketName, requiredCredits: Number(l.requiredCredits) || 0 })), totalRequired: total, ...meta }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    show('Credit plan saved'); onClose();
  }

  if (!loaded) return <div className="text-gray-400 text-sm py-6">Loading…</div>;

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-500">Set how many credits <b>{student.name}</b> must earn in each basket. Seeded from basket defaults — adjust as needed.</div>
      {!baskets.length && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded p-3">No baskets exist yet. Add baskets first (Baskets tab).</div>}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-8 text-sm font-medium">{l.basketName}</div>
            <div className="col-span-4"><input className="input py-1" type="number" min="0" value={l.requiredCredits} onChange={(e) => setLine(i, e.target.value)} /></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
        <Field label="Credits / semester"><input className="input" type="number" value={meta.creditsPerSemester} onChange={(e) => setMeta({ ...meta, creditsPerSemester: Number(e.target.value) })} /></Field>
        <Field label="Expected semesters"><input className="input" type="number" value={meta.expectedSemesters} onChange={(e) => setMeta({ ...meta, expectedSemesters: Number(e.target.value) })} /></Field>
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-sm">Total required: <b>{total}</b> credits</div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={!lines.length}>Save plan</button>
        </div>
      </div>
    </div>
  );
}

/* ============ Branch-change decisions (HoD/Dean) ============ */
export function BranchDecisions({ show }) {
  const [requests, setRequests] = useState([]);
  const [remarks, setRemarks] = useState({});

  async function load() {
    const d = await fetch('/api/branch-change').then((r) => r.json());
    setRequests(d.requests || []);
  }
  useEffect(() => { load(); }, []);

  async function decide(id, decision) {
    const res = await fetch(`/api/branch-change/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decide', decision, decisionRemarks: remarks[id] || '' }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    show(`Request ${decision.toLowerCase()}`); load();
  }

  const pending = requests.filter((r) => ['RECOMMENDED', 'NOT_RECOMMENDED'].includes(r.status));
  const awaiting = requests.filter((r) => r.status === 'REQUESTED');
  const done = requests.filter((r) => ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(r.status));

  return (
    <Card title="Branch-Change Requests" actions={<span className="text-xs text-gray-500">First-year students · decide after mentor counselling</span>}>
      <div className="space-y-4">
        <Section title={`Ready for decision (${pending.length})`}>
          {pending.map((r) => (
            <div key={r._id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">{r.student?.name} <span className="text-gray-400 text-sm">{r.student?.registrationNo}</span></div>
                <Badge tone={r.status === 'RECOMMENDED' ? 'green' : 'red'}>{r.status.replace('_', ' ')}</Badge>
              </div>
              <div className="text-sm mt-1">{r.currentProgramme || '—'} → <b className="text-brand">{r.requestedProgramme}</b> · CGPA {r.currentCGPA ?? '—'}</div>
              {r.reason && <div className="text-sm text-gray-600 mt-1"><b>Reason:</b> {r.reason}</div>}
              <div className="text-sm mt-2 bg-brand-light rounded p-2"><b>Mentor ({r.mentor?.name || '—'}):</b> {r.mentorRemarks || '—'} — {r.mentorRecommends ? 'Recommended' : 'Not recommended'}</div>
              <textarea className="input mt-2" rows={2} placeholder="Decision remarks" value={remarks[r._id] || ''} onChange={(e) => setRemarks({ ...remarks, [r._id]: e.target.value })} />
              <div className="flex gap-2 mt-2">
                <button className="btn-primary" onClick={() => decide(r._id, 'APPROVED')}>Approve</button>
                <button className="btn-danger" onClick={() => decide(r._id, 'REJECTED')}>Reject</button>
              </div>
            </div>
          ))}
          {!pending.length && <div className="text-gray-400 text-sm">Nothing awaiting your decision.</div>}
        </Section>

        {awaiting.length > 0 && (
          <Section title={`Awaiting mentor counselling (${awaiting.length})`}>
            {awaiting.map((r) => (
              <div key={r._id} className="text-sm border-b py-2">{r.student?.name} — {r.requestedProgramme} <Badge tone="amber">with mentor</Badge></div>
            ))}
          </Section>
        )}

        {done.length > 0 && (
          <Section title={`Decided (${done.length})`}>
            {done.map((r) => (
              <div key={r._id} className="text-sm border-b py-2 flex items-center justify-between">
                <span>{r.student?.name} — {r.requestedProgramme}</span>
                <Badge tone={r.status === 'APPROVED' ? 'green' : 'gray'}>{r.status}</Badge>
              </div>
            ))}
          </Section>
        )}
      </div>
    </Card>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

/* ============ Learner classification policy (HoD) — NAAC 2.2.1 ============ */
export function LearnerCriteriaEditor({ show }) {
  const [c, setC] = useState(null);
  const [saved, setSaved] = useState(false);

  async function load() {
    const d = await fetch('/api/learner-criteria').then((r) => r.json());
    setC(d.criteria || d.defaults);
  }
  useEffect(() => { load(); }, []);

  function set(k, v) { setC((p) => ({ ...p, [k]: v })); setSaved(false); }

  async function save() {
    const res = await fetch('/api/learner-criteria', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setSaved(true); show('Learner policy saved');
  }

  if (!c) return <Card title="Learner Classification Policy"><div className="text-gray-400 text-sm">Loading…</div></Card>;

  const num = (k, label, step = '0.1') => (
    <div><label className="label">{label}</label><input className="input" type="number" step={step} value={c[k] ?? ''} onChange={(e) => set(k, Number(e.target.value))} /></div>
  );
  const chk = (k, label) => (
    <label className="flex items-center gap-2 text-sm py-1"><input type="checkbox" checked={!!c[k]} onChange={(e) => set(k, e.target.checked)} /> {label}</label>
  );

  return (
    <Card title="Learner Classification Policy" actions={<span className="text-xs text-gray-500">NAAC 2.2.1 — slow & advanced learners</span>}>
      <p className="text-sm text-gray-600 mb-4">These criteria decide how the system flags each student as a <b>slow</b>, <b>average</b> or <b>advanced</b> learner. They are your documented methodology for accreditation — keep them realistic and, ideally, ratified by your Academic Council.</p>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3 border border-gray-200 rounded-xl p-4">
          <div className="font-semibold text-sm text-gray-800">Thresholds</div>
          <div><label className="label">Mode</label>
            <select className="input" value={c.mode} onChange={(e) => set('mode', e.target.value)}>
              <option value="ABSOLUTE">Absolute cut-offs only</option>
              <option value="PERCENTILE">Cohort percentile only</option>
              <option value="HYBRID">Hybrid (either condition)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {num('cgpaSlowBelow', 'Slow if CGPA below')}
            {num('cgpaAdvancedAtLeast', 'Advanced if CGPA ≥')}
            {num('slowPercentile', 'Slow if bottom %', '1')}
            {num('advancedPercentile', 'Advanced if top (100−%)', '1')}
            {num('attendanceMin', 'Min attendance %', '1')}
            {num('attainmentSlowBelow', 'Slow if CO/PO attainment <', '0.1')}
          </div>
        </div>
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-xl p-4 space-y-1">
            <div className="font-semibold text-sm text-gray-800 mb-1">Signals to consider</div>
            {chk('considerBacklogs', 'Any live backlog marks a student as slow')}
            {chk('considerAttendance', 'Low attendance marks a student as slow')}
            {chk('considerAttainment', 'Low CO/PO attainment marks a student as slow (NBA)')}
          </div>
          <div><label className="label">Policy note (shown on the report)</label><textarea className="input" rows={4} value={c.policyNote || ''} onChange={(e) => set('policyNote', e.target.value)} /></div>
          <div><label className="label">Ratified by (optional)</label><input className="input" placeholder="Academic Council, 12 Jun 2026" value={c.ratifiedBy || ''} onChange={(e) => set('ratifiedBy', e.target.value)} /></div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button className="btn-primary" onClick={save}>Save policy</button>
        <a className="btn-ghost" href="/api/reports/learners?format=xlsx">Download learner report (Excel)</a>
        {saved && <span className="text-green-600 text-sm">✓ Saved</span>}
      </div>
    </Card>
  );
}
