'use client';
import { useEffect, useState } from 'react';
import { Card, Field, Badge, statusTone } from '@/components/ui';

/* ============ Basket manager (HoD) ============ */
export function BasketManager({ show }) {
  const [baskets, setBaskets] = useState([]);
  const [form, setForm] = useState(blank());
  const [editingId, setEditingId] = useState(null);

  function blank() {
    return { name: '', code: '', defaultCredits: '', aliases: '', order: '', description: '' };
  }

  async function load() {
    const d = await fetch('/api/baskets').then((r) => r.json());
    const list = d.baskets || [];
    list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || (a.name || '').localeCompare(b.name || ''));
    setBaskets(list);
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `/api/baskets/${editingId}` : '/api/baskets';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setForm(blank());
    setEditingId(null);
    show(editingId ? 'Basket updated' : 'Basket added');
    load();
  }

  async function remove(id) {
    if (!confirm('Remove this basket? Historical records keep their labels.')) return;
    await fetch(`/api/baskets/${id}`, { method: 'DELETE' });
    if (editingId === id) {
      setEditingId(null);
      setForm(blank());
    }
    show('Basket removed');
    load();
  }

  function edit(b) {
    setEditingId(b._id);
    setForm({
      name: b.name,
      code: b.code || '',
      defaultCredits: b.defaultCredits ?? '',
      aliases: (b.aliases || []).join(', '),
      order: b.order ?? '',
      description: b.description || '',
    });
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        document.getElementById('basket-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(blank());
  }

  return (
    <div className="grid lg:grid-cols-12 gap-5 lg:gap-6 items-start">
      {/* List first — primary content */}
      <section className="lg:col-span-7 order-2 lg:order-1">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="font-bold text-ink text-base">Your baskets</h2>
            <p className="text-xs text-ink/50 mt-0.5">
              Used in credit plans, gradesheet mapping, and the student tracker
            </p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-ink/45 shrink-0">
            {baskets.length} total
          </span>
        </div>

        {baskets.length ? (
          <ul className="space-y-2">
            {baskets.map((b, idx) => (
              <li
                key={b._id}
                className={`rounded-xl border px-4 py-3.5 transition-colors ${
                  editingId === b._id
                    ? 'border-brand/40 bg-brand-light/40'
                    : 'border-ink/10 bg-white hover:border-ink/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold tabular-nums text-ink/30 w-5">
                        {b.order != null && b.order !== '' ? b.order : idx + 1}
                      </span>
                      <h3 className="font-semibold text-ink text-sm sm:text-base truncate">{b.name}</h3>
                      {b.code ? <Badge tone="gray">{b.code}</Badge> : null}
                      <span className="text-xs font-semibold tabular-nums text-ink/55 bg-cream px-2 py-0.5 rounded-md">
                        {b.defaultCredits || 0} cr
                      </span>
                    </div>
                    {b.aliases?.length ? (
                      <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
                        {b.aliases.map((a) => (
                          <span
                            key={a}
                            className="text-[11px] text-ink/50 bg-ink/[0.04] px-2 py-0.5 rounded-md"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-ink/35 mt-1.5 ml-7">No aliases — add PDF labels if mapping fails</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="btn-ghost !py-1.5 !px-3 text-xs"
                      onClick={() => edit(b)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-ghost !py-1.5 !px-3 text-xs !text-brand-dark hover:!bg-brand-light"
                      onClick={() => remove(b._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-ink/15 bg-white/60 px-5 py-10 text-center">
            <p className="font-semibold text-ink text-sm">No baskets yet</p>
            <p className="text-xs text-ink/50 mt-1 max-w-xs mx-auto leading-relaxed">
              Add Foundation Core, Program Core, and electives so credit plans and gradesheets can map courses.
            </p>
          </div>
        )}
      </section>

      {/* Compact form — secondary */}
      <aside className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-20">
        <form
          id="basket-form"
          onSubmit={save}
          className="rounded-xl border border-ink/10 bg-white p-4 sm:p-5 space-y-3.5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-bold text-ink text-base">
                {editingId ? 'Edit basket' : 'Add basket'}
              </h2>
              <p className="text-xs text-ink/50 mt-0.5">
                {editingId ? 'Update name, credits, or aliases' : 'Only name is required'}
              </p>
            </div>
            {editingId ? <Badge tone="brand">Editing</Badge> : null}
          </div>

          <Field label="Name *">
            <input
              className="input"
              placeholder="e.g. Program Core"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="off"
            />
          </Field>

          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Code">
              <input
                className="input"
                placeholder="PC"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                autoComplete="off"
              />
            </Field>
            <Field label="Credits">
              <input
                className="input"
                type="number"
                min="0"
                placeholder="24"
                value={form.defaultCredits}
                onChange={(e) => setForm({ ...form, defaultCredits: e.target.value })}
              />
            </Field>
            <Field label="Order">
              <input
                className="input"
                type="number"
                min="0"
                placeholder="1"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Aliases" hint="Comma-separated PDF labels, e.g. Core, Discipline Core">
            <input
              className="input"
              placeholder="Core, Discipline Core"
              value={form.aliases}
              onChange={(e) => setForm({ ...form, aliases: e.target.value })}
              autoComplete="off"
            />
          </Field>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary !py-2 !px-5 text-sm">
              {editingId ? 'Save changes' : 'Add basket'}
            </button>
            {editingId ? (
              <button type="button" className="btn-ghost !py-2 text-sm" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </aside>
    </div>
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
        setLines(plan.lines.map((l) => ({
          basket: String(l.basket || ''),
          basketName: l.basketName,
          requiredCredits: l.requiredCredits,
        })));
        setMeta({
          creditsPerSemester: plan.creditsPerSemester || 20,
          expectedSemesters: plan.expectedSemesters || 8,
        });
      } else {
        setLines(bl.map((b) => ({
          basket: String(b._id),
          basketName: b.name,
          requiredCredits: b.defaultCredits || 0,
        })));
      }
      setLoaded(true);
    })();
  }, [student._id]);

  const total = lines.reduce((a, l) => a + (Number(l.requiredCredits) || 0), 0);
  const setLine = (i, v) => setLines((p) => p.map((l, x) => (x === i ? { ...l, requiredCredits: v } : l)));

  async function save() {
    const res = await fetch(`/api/credit-plan/${student._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: lines.map((l) => ({
          basket: l.basket,
          basketName: l.basketName,
          requiredCredits: Number(l.requiredCredits) || 0,
        })),
        totalRequired: total,
        ...meta,
      }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    show('Credit plan saved');
    onClose();
  }

  if (!loaded) {
    return <p className="text-ink/40 text-sm py-8 text-center">Loading credit plan…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-accent-mint/70 px-4 py-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Total required</div>
          <div className="text-2xl font-bold tabular-nums text-ink">{total} <span className="text-sm font-semibold text-ink/50">credits</span></div>
        </div>
        <p className="text-xs text-ink/55 max-w-xs leading-relaxed">
          Seeded from basket defaults — adjust per student as needed.
        </p>
      </div>

      {!baskets.length && (
        <div className="ui-callout-warn p-3.5 text-sm">
          No baskets exist yet. Add baskets under <b>Credit Baskets</b> first.
        </div>
      )}

      <div className="space-y-1 max-h-72 overflow-y-auto divide-y divide-ink/8 ui-nest px-3">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2 py-2.5">
            <div className="col-span-7 sm:col-span-8 text-sm font-medium text-ink">{l.basketName}</div>
            <div className="col-span-5 sm:col-span-4">
              <input
                className="input !py-1.5 text-sm tabular-nums"
                type="number"
                min="0"
                value={l.requiredCredits}
                onChange={(e) => setLine(i, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Credits / semester">
          <input
            className="input"
            type="number"
            value={meta.creditsPerSemester}
            onChange={(e) => setMeta({ ...meta, creditsPerSemester: Number(e.target.value) })}
          />
        </Field>
        <Field label="Expected semesters">
          <input
            className="input"
            type="number"
            value={meta.expectedSemesters}
            onChange={(e) => setMeta({ ...meta, expectedSemesters: Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button type="button" className="btn-primary flex-1 !py-2.5" onClick={save} disabled={!lines.length}>
          Save plan
        </button>
        <button type="button" className="btn-ghost !py-2.5" onClick={onClose}>Cancel</button>
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decide', decision, decisionRemarks: remarks[id] || '' }),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    show(`Request ${decision.toLowerCase()}`);
    load();
  }

  const pending = requests.filter((r) => ['RECOMMENDED', 'NOT_RECOMMENDED'].includes(r.status));
  const awaiting = requests.filter((r) => r.status === 'REQUESTED');
  const done = requests.filter((r) => ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(r.status));

  return (
    <Card
      title="Branch-change requests"
      subtitle="First-year students — decide after mentor counselling"
    >
      <div className="space-y-5">
        <Section title={`Ready for decision (${pending.length})`}>
          {pending.map((r) => (
            <div key={r._id} className="ui-nest p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-ink">{r.student?.name}</div>
                  <div className="text-xs text-ink/40">{r.student?.registrationNo}</div>
                </div>
                <Badge tone={r.status === 'RECOMMENDED' ? 'green' : 'red'}>
                  {r.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="text-sm mt-2 text-ink">
                {r.currentProgramme || '—'} <span className="text-ink/30">→</span>{' '}
                <b className="text-brand">{r.requestedProgramme}</b>
                <span className="text-ink/45"> · CGPA {r.currentCGPA ?? '—'}</span>
              </div>
              {r.reason && (
                <p className="text-sm text-ink/65 mt-1.5">
                  <span className="font-semibold text-ink">Reason:</span> {r.reason}
                </p>
              )}
              <div className="text-sm mt-2 ui-callout-warn p-2.5">
                <b>Mentor ({r.mentor?.name || '—'}):</b> {r.mentorRemarks || '—'} —{' '}
                {r.mentorRecommends ? 'Recommended' : 'Not recommended'}
              </div>
              <textarea
                className="input mt-3"
                rows={2}
                placeholder="Decision remarks (optional)"
                value={remarks[r._id] || ''}
                onChange={(e) => setRemarks({ ...remarks, [r._id]: e.target.value })}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" className="btn-primary !py-2" onClick={() => decide(r._id, 'APPROVED')}>
                  Approve
                </button>
                <button type="button" className="btn-ghost !py-2" onClick={() => decide(r._id, 'REJECTED')}>
                  Reject
                </button>
              </div>
            </div>
          ))}
          {!pending.length && (
            <p className="text-ink/40 text-sm">Nothing awaiting your decision.</p>
          )}
        </Section>

        {awaiting.length > 0 && (
          <Section title={`Awaiting mentor counselling (${awaiting.length})`}>
            {awaiting.map((r) => (
              <div key={r._id} className="ui-nest p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium text-ink">{r.student?.name}</span>
                  <span className="text-ink/45"> — {r.requestedProgramme}</span>
                </div>
                <Badge tone="amber">With mentor</Badge>
              </div>
            ))}
          </Section>
        )}

        {done.length > 0 && (
          <Section title={`Decided (${done.length})`}>
            {done.map((r) => (
              <div key={r._id} className="flex items-center justify-between gap-2 py-2 border-b border-ink/8 last:border-0 text-sm">
                <span>
                  <span className="font-medium text-ink">{r.student?.name}</span>
                  <span className="text-ink/45"> — {r.requestedProgramme}</span>
                </span>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
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
      <div className="text-xs font-bold uppercase tracking-wide text-ink/45 mb-2">{title}</div>
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

  function set(k, v) {
    setC((p) => ({ ...p, [k]: v }));
    setSaved(false);
  }

  async function save() {
    const res = await fetch('/api/learner-criteria', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    });
    const d = await res.json();
    if (!res.ok) return show(d.error || 'Failed');
    setSaved(true);
    show('Learner policy saved');
  }

  if (!c) {
    return (
      <Card title="Learner classification policy">
        <p className="text-ink/40 text-sm py-4">Loading…</p>
      </Card>
    );
  }

  return (
    <Card
      title="Learner classification policy"
      subtitle="NAAC 2.2.1 — how the system flags slow, average, and advanced learners"
      actions={(
        <a className="btn-ghost !py-1.5 !px-3 text-xs" href="/api/reports/learners?format=xlsx">
          Learner Excel
        </a>
      )}
    >
      <p className="text-sm text-ink/60 mb-4 leading-relaxed">
        These criteria are your documented methodology for accreditation. Keep them realistic and,
        ideally, ratified by your Academic Council.
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3 ui-nest-muted p-4">
          <div className="font-semibold text-sm text-ink">Thresholds</div>
          <Field label="Mode">
            <select className="input" value={c.mode} onChange={(e) => set('mode', e.target.value)}>
              <option value="ABSOLUTE">Absolute cut-offs only</option>
              <option value="PERCENTILE">Cohort percentile only</option>
              <option value="HYBRID">Hybrid (either condition)</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Slow if CGPA below">
              <input className="input" type="number" step="0.1" value={c.cgpaSlowBelow ?? ''} onChange={(e) => set('cgpaSlowBelow', Number(e.target.value))} />
            </Field>
            <Field label="Advanced if CGPA ≥">
              <input className="input" type="number" step="0.1" value={c.cgpaAdvancedAtLeast ?? ''} onChange={(e) => set('cgpaAdvancedAtLeast', Number(e.target.value))} />
            </Field>
            <Field label="Slow if bottom %">
              <input className="input" type="number" step="1" value={c.slowPercentile ?? ''} onChange={(e) => set('slowPercentile', Number(e.target.value))} />
            </Field>
            <Field label="Advanced if top (100−%)">
              <input className="input" type="number" step="1" value={c.advancedPercentile ?? ''} onChange={(e) => set('advancedPercentile', Number(e.target.value))} />
            </Field>
            <Field label="Min attendance %">
              <input className="input" type="number" step="1" value={c.attendanceMin ?? ''} onChange={(e) => set('attendanceMin', Number(e.target.value))} />
            </Field>
            <Field label="Slow if CO/PO attainment <">
              <input className="input" type="number" step="0.1" value={c.attainmentSlowBelow ?? ''} onChange={(e) => set('attainmentSlowBelow', Number(e.target.value))} />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <div className="ui-callout-ok p-4 space-y-2">
            <div className="font-semibold text-sm text-ink mb-1">Signals to consider</div>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={!!c.considerBacklogs} onChange={(e) => set('considerBacklogs', e.target.checked)} />
              <span>Any live backlog marks a student as slow</span>
            </label>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={!!c.considerAttendance} onChange={(e) => set('considerAttendance', e.target.checked)} />
              <span>Low attendance marks a student as slow</span>
            </label>
            <label className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={!!c.considerAttainment} onChange={(e) => set('considerAttainment', e.target.checked)} />
              <span>Low CO/PO attainment marks as slow (NBA)</span>
            </label>
          </div>
          <Field label="Policy note" hint="Shown on the learner report.">
            <textarea
              className="input"
              rows={3}
              value={c.policyNote || ''}
              onChange={(e) => set('policyNote', e.target.value)}
            />
          </Field>
          <Field label="Ratified by" optional>
            <input
              className="input"
              placeholder="Academic Council, 12 Jun 2026"
              value={c.ratifiedBy || ''}
              onChange={(e) => set('ratifiedBy', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-ink/8">
        <button type="button" className="btn-primary !py-2.5" onClick={save}>Save policy</button>
        {saved && <span className="text-sm font-medium text-ink/55">Saved</span>}
      </div>
    </Card>
  );
}
