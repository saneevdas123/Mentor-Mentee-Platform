'use client';
import { Badge } from '@/components/ui';

function Bar({ pct, tone = '#FF4B3E' }) {
  return (
    <div className="w-full bg-ink/10 rounded-full h-2.5 overflow-hidden border border-ink/15">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: tone }} />
    </div>
  );
}

const statusTone = (s) => (s === 'COMPLETE' ? 'green' : s === 'IN_PROGRESS' ? 'amber' : 'gray');

export default function CreditTracker({ progress }) {
  if (!progress) return null;
  if (!progress.hasPlan) {
    return (
      <div className="bg-accent-yellow border-2 border-ink rounded-neo p-4 text-sm text-ink shadow-hard-sm">
        No credit plan has been set for this student yet. A Head of Department needs to define the basket-wise
        credit requirements before the tracker can show progress.
      </div>
    );
  }
  const p = progress;
  const barTone = p.overallPct >= 100 ? '#58C6B1' : p.overallPct >= 60 ? '#F9CA24' : '#FF4B3E';

  return (
    <div className="space-y-5">
      <div className="card p-4 bg-accent-mint">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-ink">Overall completion</div>
          <div className="text-sm text-ink/55">
            {p.earnedTotal} / {p.totalRequired} credits · <b>{p.overallPct}%</b>
          </div>
        </div>
        <Bar pct={p.overallPct} tone={barTone} />
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-ink/65">
          <span>Remaining: <b>{p.totalRemaining}</b> credits</span>
          {p.semestersLeft != null && <span>Est. semesters left: <b>{p.semestersLeft}</b> (at {p.perSem}/sem)</span>}
          {p.onTrack != null && (
            <span>Graduation: {p.onTrack ? <Badge tone="green">On track</Badge> : <Badge tone="red">At risk of delay</Badge>}</span>
          )}
          {p.unassignedCredits > 0 && <span className="text-brand-dark font-medium">Unassigned credits: <b>{p.unassignedCredits}</b> (map them in gradesheet review)</span>}
        </div>
      </div>

      <div className="space-y-3">
        {p.lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-4 text-sm">
              <div className="font-semibold text-ink">{l.basketName}</div>
              <div className="text-xs text-ink/40"><Badge tone={statusTone(l.status)}>{l.status.replace('_', ' ')}</Badge></div>
            </div>
            <div className="col-span-6"><Bar pct={l.pct} tone={l.status === 'COMPLETE' ? '#58C6B1' : '#F9CA24'} /></div>
            <div className="col-span-2 text-right text-sm tabular-nums">
              <span className="font-bold">{l.earned}</span>
              <span className="text-ink/40">/{l.required}</span>
            </div>
          </div>
        ))}
      </div>

      {p.recommendations.length > 0 && (
        <div className="bg-accent-peach border-2 border-ink rounded-neo p-4 shadow-hard-sm">
          <div className="font-bold text-ink mb-1 text-sm">To finish on time, focus next on:</div>
          <ul className="list-disc pl-5 text-sm text-ink/80 space-y-0.5">
            {p.recommendations.map((r, i) => (
              <li key={i}>{r.creditsToTake} credit(s) in <b>{r.basketName}</b></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
