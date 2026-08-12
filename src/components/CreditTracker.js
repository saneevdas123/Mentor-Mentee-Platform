'use client';
import { Badge } from '@/components/ui';

function Bar({ pct, tone = '#FF4B3E' }) {
  return (
    <div className="w-full bg-ink/8 rounded-full h-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: tone }}
      />
    </div>
  );
}

const statusLabel = (s) => (s || 'NOT_STARTED').replace(/_/g, ' ');
const statusClass = (s) => {
  if (s === 'COMPLETE') return 'text-[#2a8f7a]';
  if (s === 'IN_PROGRESS') return 'text-[#b8860b]';
  return 'text-ink/40';
};

export default function CreditTracker({ progress }) {
  if (!progress) {
    return <p className="text-sm text-ink/45 py-2">Loading credit progress…</p>;
  }
  if (!progress.hasPlan) {
    return (
      <div className="ui-callout-warn p-4 text-sm text-ink">
        No credit plan has been set for you yet. Your Head of Department needs to define basket-wise
        credit requirements before progress can show here.
      </div>
    );
  }

  const p = progress;
  const barTone = p.overallPct >= 100 ? '#58C6B1' : p.overallPct >= 60 ? '#F9CA24' : '#FF4B3E';

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-accent-mint/80 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Overall completion</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums tracking-tight text-ink">{p.overallPct}%</span>
              <span className="text-sm text-ink/55">
                {p.earnedTotal} / {p.totalRequired} credits
              </span>
            </div>
          </div>
          {p.onTrack != null && (
            p.onTrack
              ? <Badge tone="green">On track</Badge>
              : <Badge tone="red">At risk of delay</Badge>
          )}
        </div>
        <Bar pct={p.overallPct} tone={barTone} />
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-ink/60">
          <span>Remaining <b className="text-ink">{p.totalRemaining}</b></span>
          {p.semestersLeft != null && (
            <span>Est. <b className="text-ink">{p.semestersLeft}</b> sem left · {p.perSem}/sem</span>
          )}
          {p.unassignedCredits > 0 && (
            <span className="text-brand-dark font-medium">
              {p.unassignedCredits} unassigned — wait for mentor mapping
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-ink/8">
        {p.lines.map((l, i) => (
          <div key={i} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{l.basketName}</div>
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${statusClass(l.status)}`}>
                  {statusLabel(l.status)}
                </div>
              </div>
              <div className="text-sm tabular-nums shrink-0">
                <span className="font-bold text-ink">{l.earned}</span>
                <span className="text-ink/35">/{l.required}</span>
              </div>
            </div>
            <Bar pct={l.pct} tone={l.status === 'COMPLETE' ? '#58C6B1' : l.status === 'IN_PROGRESS' ? '#F9CA24' : '#d6d0c4'} />
          </div>
        ))}
      </div>

      {p.recommendations.length > 0 && (
        <div className="ui-callout-soft p-3.5">
          <div className="font-semibold text-ink mb-1.5 text-sm">To finish on time, focus next on</div>
          <ul className="space-y-1 text-sm text-ink/75">
            {p.recommendations.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-ink/35 select-none">→</span>
                <span>
                  <b className="text-ink font-semibold">{r.creditsToTake}</b> credit(s) in {r.basketName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
