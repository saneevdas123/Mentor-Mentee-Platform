'use client';
import { useState } from 'react';

const STAT_ACCENTS = {
  brand: 'bg-accent-peach',
  red: 'bg-accent-pink',
  amber: 'bg-accent-yellow',
  green: 'bg-accent-mint',
  gray: 'bg-white',
};

const STAT_TEXT = {
  brand: 'text-ink',
  red: 'text-ink',
  amber: 'text-ink',
  green: 'text-ink',
  gray: 'text-ink',
};

export function Stat({ label, value, sub, tone = 'brand' }) {
  return (
    <div className={`card p-5 ${STAT_ACCENTS[tone] || STAT_ACCENTS.brand}`}>
      <div className="text-xs font-bold text-ink/55 uppercase tracking-wide">{label}</div>
      <div className={`mt-2 text-3xl font-bold tracking-tight ${STAT_TEXT[tone] || STAT_TEXT.brand}`}>{value}</div>
      {sub && <div className="mt-1 text-xs font-medium text-ink/55">{sub}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', accent }) {
  const accents = {
    yellow: 'bg-accent-yellow',
    mint: 'bg-accent-mint',
    peach: 'bg-accent-peach',
    pink: 'bg-accent-pink',
  };
  return (
    <div className={`card ${accent ? accents[accent] || '' : 'bg-white'} ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink/10">
          <h3 className="font-bold text-ink">{title}</h3>
          <div className="flex gap-2">{actions}</div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 no-print" onClick={onClose}>
      <div
        className={`bg-cream rounded-neo border-2 border-ink shadow-hard-lg w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-ink sticky top-0 bg-cream">
          <h3 className="font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink text-2xl leading-none font-bold" aria-label="Close">&times;</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-cream text-ink border-ink/25',
    green: 'bg-accent-mint text-ink border-ink/20',
    red: 'bg-accent-pink text-ink border-ink/20',
    amber: 'bg-accent-yellow text-ink border-ink/20',
    blue: 'bg-white text-ink border-ink/25',
    brand: 'bg-brand-light text-ink border-brand/40',
  };
  return <span className={`badge ${tones[tone] || tones.gray}`}>{children}</span>;
}

export function riskTone(r) { return r === 'HIGH' ? 'red' : r === 'MEDIUM' ? 'amber' : 'green'; }
export function statusTone(s) {
  return ({ OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green', CLOSED: 'gray', ESCALATED: 'red',
    SCHEDULED: 'blue', NOTIFIED: 'brand', COMPLETED: 'green', CANCELLED: 'gray' })[s] || 'gray';
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (m, t = 3000) => { setMsg(m); setTimeout(() => setMsg(null), t); };
  const node = msg ? (
    <div className="fixed bottom-4 right-4 z-50 bg-ink text-cream text-sm font-semibold px-4 py-2.5 rounded-xl border-2 border-ink shadow-hard no-print">
      {msg}
    </div>
  ) : null;
  return { show, node };
}
