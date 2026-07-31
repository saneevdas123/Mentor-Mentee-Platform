'use client';
import { Badge } from '@/components/ui';

function Bar({ pct, tone = '#0b5d3b' }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
      <div
        className="h-2.5 rounded-full progress-bar"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: tone }}
      />
    </div>
  );
}

const statusTone = (s) => (s === 'COMPLETE' ? 'green' : s === 'IN_PROGRESS' ? 'amber' : 'gray');

export default function CreditTracker({ progress }) {
  if (!progress) {
    return (
      <div className="space-y-3 animate-pulse" aria-busy="true">
        <div className="skeleton h-20 w-full rounded-xl" />
        <div className="skeleton h-10 w-full" />
        <div className="skeleton h-10 w-full" />
      </div>
    );
  }
  if (!progress.hasPlan) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm">
        No credit plan has been set for this student yet. A Head of Department needs to define the basket-wise
        credit requirements (CBCS) before the tracker can show progress.
      </div>
    );
  }
  const p = progress;
  const barTone = p.overallPct >= 100 ? '#0b5d3b' : p.overallPct >= 60 ? '#c8a24a' : '#b45309';

  return (
    <div className="space-y-5 animate-fade-up">
      {(p.pendingSheets > 0 || p.verifiedSheets === 0) && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 text-sm">
          {p.verifiedSheets === 0
            ? 'Official progress starts after the mentor verifies uploaded gradesheets (basket mapping confirmed).'
            : `${p.pendingSheets} gradesheet(s) awaiting mentor verification — they are not counted in the official tracker yet.`}
        </div>
      )}

      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-800">Overall completion</div>
          <div className="text-sm text-gray-500">
            {p.earnedTotal} / {p.totalRequired} credits · <b>{p.overallPct}%</b>
          </div>
        </div>
        <Bar pct={p.overallPct} tone={barTone} />
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-600">
          <span>Remaining: <b>{p.totalRemaining}</b> credits</span>
          {p.semestersLeft != null && <span>Est. semesters left: <b>{p.semestersLeft}</b> (at {p.perSem}/sem)</span>}
          {p.onTrack != null && (
            <span>Graduation: {p.onTrack ? <Badge tone="green">On track</Badge> : <Badge tone="red">At risk of delay</Badge>}</span>
          )}
          {p.unassignedCredits > 0 && (
            <span className="text-amber-700">Unassigned credits: <b>{p.unassignedCredits}</b> (map them in gradesheet review)</span>
          )}
          {p.verifiedSheets != null && (
            <span>Verified sheets: <b>{p.verifiedSheets}</b></span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Basket-wise (CBCS)</div>
        {p.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-4 text-sm">
              <div className="font-medium text-gray-800">{l.basketName}</div>
              <div className="text-xs text-gray-400"><Badge tone={statusTone(l.status)}>{l.status.replace('_', ' ')}</Badge></div>
            </div>
            <div className="col-span-6"><Bar pct={l.pct} tone={l.status === 'COMPLETE' ? '#0b5d3b' : '#c8a24a'} /></div>
            <div className="col-span-2 text-right text-sm tabular-nums">
              <span className="font-semibold">{l.earned}</span>
              <span className="text-gray-400">/{l.required}</span>
            </div>
          </div>
        ))}
      </div>

      {p.recommendations.length > 0 && (
        <div className="bg-brand-light border border-green-200 rounded-lg p-4">
          <div className="font-semibold text-brand mb-1 text-sm">To finish on time, take credits next in:</div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-0.5">
            {p.recommendations.map((r, i) => (
              <li key={i}>
                <b>{r.creditsToTake}</b> credit(s) in <b>{r.basketName}</b>
                {r.priority === 'HIGH' && <Badge tone="red"> Priority</Badge>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">Mentors should record this as Credit Counselling so the student can acknowledge and it appears in the interaction report.</p>
        </div>
      )}
    </div>
  );
}
