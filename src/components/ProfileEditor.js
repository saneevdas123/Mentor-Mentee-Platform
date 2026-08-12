'use client';
import { useState } from 'react';
import { Field, Badge, TabBar, Tab } from '@/components/ui';

const emptySem = () => ({ semester: '', academicYear: '', sgpa: '', cgpa: '', backlogs: 0, attendancePercent: '', resultStatus: 'PENDING' });
const emptyPlacement = () => ({ type: 'PLACEMENT', company: '', role: '', ctcLPA: '', status: 'OFFERED' });
const emptyActivity = () => ({ category: 'CO_CURRICULAR', title: '', level: 'INSTITUTE', position: '', date: '' });
const emptyAttain = () => ({ academicYear: '', course: '', coAttainment: '', poAttainment: '' });

export default function ProfileEditor({ student, onSave, onClose, readOnly }) {
  const [tab, setTab] = useState('basic');
  const [f, setF] = useState({
    ...student,
    semesterResults: student.semesterResults || [],
    placements: student.placements || [],
    activities: student.activities || [],
    scholarships: student.scholarships || [],
    attainments: student.attainments || [],
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setArr = (k, i, key, v) => setF((p) => { const a = [...p[k]]; a[i] = { ...a[i], [key]: v }; return { ...p, [k]: a }; });
  const addArr = (k, factory) => setF((p) => ({ ...p, [k]: [...p[k], factory()] }));
  const delArr = (k, i) => setF((p) => ({ ...p, [k]: p[k].filter((_, x) => x !== i) }));

  async function save() {
    setSaving(true);
    // normalize numbers
    const payload = { ...f };
    payload.semesterResults = payload.semesterResults.map((s) => ({ ...s, semester: Number(s.semester) || undefined, sgpa: parseFloat(s.sgpa) || undefined, cgpa: parseFloat(s.cgpa) || undefined, backlogs: Number(s.backlogs) || 0, attendancePercent: parseFloat(s.attendancePercent) || undefined }));
    payload.placements = payload.placements.map((p) => ({ ...p, ctcLPA: parseFloat(p.ctcLPA) || undefined }));
    payload.attainments = payload.attainments.map((a) => ({ ...a, coAttainment: parseFloat(a.coAttainment) || undefined, poAttainment: parseFloat(a.poAttainment) || undefined }));
    await onSave(payload);
    setSaving(false);
  }

  const tabs = [
    ['basic', 'Basic'], ['academics', 'Academics'], ['placements', 'Placements'],
    ['activities', 'Activities'], ['nba', 'NBA / OBE'], ['mentoring', 'Mentoring'],
  ];

  return (
    <div>
      <TabBar className="!mb-3">
        {tabs.map(([k, l]) => (
          <Tab key={k} active={tab === k} onClick={() => setTab(k)} className="!text-xs !px-3 !py-2">{l}</Tab>
        ))}
      </TabBar>

      {tab === 'basic' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><input className="input" value={f.name || ''} onChange={(e) => set('name', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Registration No"><input className="input" value={f.registrationNo || ''} disabled /></Field>
          <Field label="Email"><input className="input" value={f.email || ''} onChange={(e) => set('email', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Phone"><input className="input" value={f.phone || ''} onChange={(e) => set('phone', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Programme"><input className="input" value={f.programme || ''} onChange={(e) => set('programme', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Batch"><input className="input" value={f.batch || ''} onChange={(e) => set('batch', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Current semester"><input className="input" type="number" value={f.currentSemester || ''} onChange={(e) => set('currentSemester', Number(e.target.value))} disabled={readOnly} /></Field>
          <Field label="Category"><select className="input" value={f.category || ''} onChange={(e) => set('category', e.target.value)} disabled={readOnly}><option value="">—</option><option>GEN</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option></select></Field>
          <Field label="Domicile state"><input className="input" value={f.domicileState || ''} onChange={(e) => set('domicileState', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Father name"><input className="input" value={f.fatherName || ''} onChange={(e) => set('fatherName', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Parent email"><input className="input" value={f.parentEmail || ''} onChange={(e) => set('parentEmail', e.target.value)} disabled={readOnly} /></Field>
          <Field label="Parent phone"><input className="input" value={f.parentPhone || ''} onChange={(e) => set('parentPhone', e.target.value)} disabled={readOnly} /></Field>
        </div>
      )}

      {tab === 'academics' && (
        <div>
          <table className="w-full text-sm mb-3">
            <thead><tr><th className="th">Sem</th><th className="th">Year</th><th className="th">SGPA</th><th className="th">CGPA</th><th className="th">Backlogs</th><th className="th">Att%</th><th className="th">Status</th><th className="th"></th></tr></thead>
            <tbody>
              {f.semesterResults.map((s, i) => (
                <tr key={i}>
                  <td className="td"><input className="input w-16" value={s.semester} onChange={(e) => setArr('semesterResults', i, 'semester', e.target.value)} disabled={readOnly} /></td>
                  <td className="td"><input className="input w-24" value={s.academicYear} onChange={(e) => setArr('semesterResults', i, 'academicYear', e.target.value)} disabled={readOnly} /></td>
                  <td className="td"><input className="input w-16" value={s.sgpa} onChange={(e) => setArr('semesterResults', i, 'sgpa', e.target.value)} disabled={readOnly} /></td>
                  <td className="td"><input className="input w-16" value={s.cgpa} onChange={(e) => setArr('semesterResults', i, 'cgpa', e.target.value)} disabled={readOnly} /></td>
                  <td className="td"><input className="input w-16" value={s.backlogs} onChange={(e) => setArr('semesterResults', i, 'backlogs', e.target.value)} disabled={readOnly} /></td>
                  <td className="td"><input className="input w-16" value={s.attendancePercent} onChange={(e) => setArr('semesterResults', i, 'attendancePercent', e.target.value)} disabled={readOnly} /></td>
                  <td className="td"><select className="input" value={s.resultStatus} onChange={(e) => setArr('semesterResults', i, 'resultStatus', e.target.value)} disabled={readOnly}><option>PASS</option><option>FAIL</option><option>PENDING</option><option>DETAINED</option></select></td>
                  <td className="td">{!readOnly && <button className="text-brand font-bold" onClick={() => delArr('semesterResults', i)}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!readOnly && <button className="btn-ghost" onClick={() => addArr('semesterResults', emptySem)}>+ Add semester</button>}
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="10th %"><input className="input" value={f.tenthPercent || ''} onChange={(e) => set('tenthPercent', parseFloat(e.target.value))} disabled={readOnly} /></Field>
            <Field label="12th %"><input className="input" value={f.twelfthPercent || ''} onChange={(e) => set('twelfthPercent', parseFloat(e.target.value))} disabled={readOnly} /></Field>
            <Field label="On-time graduation"><select className="input" value={f.onTimeGraduation ? 'yes' : 'no'} onChange={(e) => set('onTimeGraduation', e.target.value === 'yes')} disabled={readOnly}><option value="yes">Yes</option><option value="no">No</option></select></Field>
          </div>
        </div>
      )}

      {tab === 'placements' && (
        <div>
          {f.placements.map((p, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <Field label="Type"><select className="input" value={p.type} onChange={(e) => setArr('placements', i, 'type', e.target.value)} disabled={readOnly}><option>PLACEMENT</option><option>INTERNSHIP</option><option>HIGHER_STUDIES</option><option>ENTREPRENEURSHIP</option></select></Field>
              <Field label="Company/Inst."><input className="input" value={p.company} onChange={(e) => setArr('placements', i, 'company', e.target.value)} disabled={readOnly} /></Field>
              <Field label="Role/Prog."><input className="input" value={p.role} onChange={(e) => setArr('placements', i, 'role', e.target.value)} disabled={readOnly} /></Field>
              <Field label="CTC (LPA)"><input className="input" value={p.ctcLPA} onChange={(e) => setArr('placements', i, 'ctcLPA', e.target.value)} disabled={readOnly} /></Field>
              <div className="flex gap-1">
                <select className="input" value={p.status} onChange={(e) => setArr('placements', i, 'status', e.target.value)} disabled={readOnly}><option>OFFERED</option><option>ACCEPTED</option><option>JOINED</option><option>DECLINED</option></select>
                {!readOnly && <button className="text-brand font-bold px-2" onClick={() => delArr('placements', i)}>✕</button>}
              </div>
            </div>
          ))}
          {!readOnly && <button className="btn-ghost" onClick={() => addArr('placements', emptyPlacement)}>+ Add placement / higher studies</button>}
        </div>
      )}

      {tab === 'activities' && (
        <div>
          {f.activities.map((a, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <Field label="Category"><select className="input" value={a.category} onChange={(e) => setArr('activities', i, 'category', e.target.value)} disabled={readOnly}><option>CO_CURRICULAR</option><option>EXTRA_CURRICULAR</option><option>CERTIFICATION</option><option>PROJECT</option><option>PUBLICATION</option><option>SPORTS</option><option>NCC_NSS</option><option>HACKATHON</option><option>AWARD</option></select></Field>
              <Field label="Title"><input className="input" value={a.title} onChange={(e) => setArr('activities', i, 'title', e.target.value)} disabled={readOnly} /></Field>
              <Field label="Level"><select className="input" value={a.level} onChange={(e) => setArr('activities', i, 'level', e.target.value)} disabled={readOnly}><option>INSTITUTE</option><option>STATE</option><option>NATIONAL</option><option>INTERNATIONAL</option></select></Field>
              <Field label="Position"><input className="input" value={a.position} onChange={(e) => setArr('activities', i, 'position', e.target.value)} disabled={readOnly} /></Field>
              <div className="flex gap-1">
                <input className="input" type="date" value={a.date ? String(a.date).slice(0, 10) : ''} onChange={(e) => setArr('activities', i, 'date', e.target.value)} disabled={readOnly} />
                {!readOnly && <button className="text-brand font-bold px-2" onClick={() => delArr('activities', i)}>✕</button>}
              </div>
            </div>
          ))}
          {!readOnly && <button className="btn-ghost" onClick={() => addArr('activities', emptyActivity)}>+ Add activity</button>}
        </div>
      )}

      {tab === 'nba' && (
        <div>
          <p className="text-xs text-ink/55 mb-2">Course / Programme Outcome attainment levels (0–3) used for NBA OBE reporting.</p>
          {f.attainments.map((a, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
              <Field label="Year"><input className="input" value={a.academicYear} onChange={(e) => setArr('attainments', i, 'academicYear', e.target.value)} disabled={readOnly} /></Field>
              <Field label="Course"><input className="input" value={a.course} onChange={(e) => setArr('attainments', i, 'course', e.target.value)} disabled={readOnly} /></Field>
              <Field label="CO attainment"><input className="input" value={a.coAttainment} onChange={(e) => setArr('attainments', i, 'coAttainment', e.target.value)} disabled={readOnly} /></Field>
              <Field label="PO attainment"><input className="input" value={a.poAttainment} onChange={(e) => setArr('attainments', i, 'poAttainment', e.target.value)} disabled={readOnly} /></Field>
              <div>{!readOnly && <button className="text-brand font-bold px-2" onClick={() => delArr('attainments', i)}>✕</button>}</div>
            </div>
          ))}
          {!readOnly && <button className="btn-ghost" onClick={() => addArr('attainments', emptyAttain)}>+ Add attainment</button>}
        </div>
      )}

      {tab === 'mentoring' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Risk level">
            <select className="input" value={f.riskLevel || 'LOW'} onChange={(e) => set('riskLevel', e.target.value)} disabled={readOnly}>
              <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
            </select>
          </Field>
          <Field label="Status">
            <select className="input" value={f.status || 'ACTIVE'} onChange={(e) => set('status', e.target.value)} disabled={readOnly}>
              <option>ACTIVE</option><option>GRADUATED</option><option>DROPPED</option><option>DETAINED</option><option>ON_LEAVE</option>
            </select>
          </Field>
          <div className="col-span-2 text-xs text-ink/55">
            Setting risk to <Badge tone="red">HIGH</Badge> flags the student in NBA at-risk reports for targeted intervention.
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-2 mt-5 pt-4 border-t">
          <button className="btn-primary flex-1" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      )}
    </div>
  );
}
