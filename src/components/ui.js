'use client';
import { useState } from 'react';

export function Stat({ label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'text-brand', red: 'text-red-600', amber: 'text-amber-600', green: 'text-green-600', gray: 'text-gray-700',
  };
  return (
    <div className="card p-5">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 no-print" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
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
    gray: 'bg-gray-100 text-gray-700', green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700', blue: 'bg-blue-100 text-blue-700', brand: 'bg-brand-light text-brand',
  };
  return <span className={`badge ${tones[tone] || tones.gray}`}>{children}</span>;
}

export function riskTone(r) { return r === 'HIGH' ? 'red' : r === 'MEDIUM' ? 'amber' : 'green'; }
export function statusTone(s) {
  return ({ OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green', CLOSED: 'gray', ESCALATED: 'red',
    SCHEDULED: 'blue', NOTIFIED: 'brand', COMPLETED: 'green', CANCELLED: 'gray' })[s] || 'gray';
}

// Tiny data-fetching hook.
export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (m, t = 3000) => { setMsg(m); setTimeout(() => setMsg(null), t); };
  const node = msg ? (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg no-print">{msg}</div>
  ) : null;
  return { show, node };
}
