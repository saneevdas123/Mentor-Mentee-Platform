'use client';
import { useEffect, useState } from 'react';

export function Stat({ label, value, sub, tone = 'brand', loading = false }) {
  const tones = {
    brand: 'text-brand', red: 'text-red-600', amber: 'text-amber-600', green: 'text-green-600', gray: 'text-gray-700',
  };
  return (
    <div className="card p-5 group">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      {loading ? (
        <div className="mt-3 skeleton h-8 w-16" />
      ) : (
        <div className={`mt-2 text-3xl font-bold tabular-nums ${tones[tone]} transition-transform duration-200 group-hover:scale-[1.02] origin-left`}>
          {value}
        </div>
      )}
      {sub && !loading && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
      {loading && <div className="mt-2 skeleton h-3 w-24" />}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }) {
  return (
    <div className={`card animate-fade-up ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 no-print animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
          <h3 className="font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-xl leading-none transition"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
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

export function Spinner({ className = '' }) {
  return <span className={`spinner inline-block ${className}`} aria-hidden />;
}

export function Btn({ children, loading, variant = 'primary', className = '', disabled, type = 'button', ...props }) {
  const variants = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  return (
    <button type={type} className={`${variants[variant] || variants.primary} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tab-track mb-4" role="tablist">
      {tabs.map((t) => {
        const key = typeof t === 'string' ? t : t.key;
        const label = typeof t === 'string' ? t : t.label;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={value === key}
            data-active={value === key}
            className="tab-btn"
            onClick={() => onChange(key)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-1 text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', description, action, icon = '◇' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 animate-fade-up">
      <div className="w-12 h-12 rounded-2xl bg-brand-light text-brand flex items-center justify-center text-lg mb-3">
        {icon}
      </div>
      <div className="font-medium text-gray-800">{title}</div>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonRows({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3 animate-fade-in" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="skeleton h-4 flex-1" style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
      {Array.from({ length: count }).map((_, i) => (
        <Stat key={i} label="…" value="—" loading />
      ))}
    </div>
  );
}

export function riskTone(r) { return r === 'HIGH' ? 'red' : r === 'MEDIUM' ? 'amber' : 'green'; }
export function statusTone(s) {
  return ({ OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green', CLOSED: 'gray', ESCALATED: 'red',
    SCHEDULED: 'blue', NOTIFIED: 'brand', COMPLETED: 'green', CANCELLED: 'gray' })[s] || 'gray';
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const show = (m, opts = {}) => {
    const tone = typeof opts === 'number' ? 'info' : (opts.tone || 'info');
    const t = typeof opts === 'number' ? opts : (opts.duration ?? 3000);
    setToast({ msg: m, tone });
    window.clearTimeout(show._t);
    show._t = window.setTimeout(() => setToast(null), t);
  };

  const tones = {
    info: 'bg-gray-900 text-white',
    success: 'bg-brand text-white',
    error: 'bg-red-600 text-white',
  };

  const node = toast ? (
    <div className={`fixed bottom-4 right-4 z-[60] text-sm px-4 py-2.5 rounded-xl shadow-lg no-print animate-toast-in flex items-center gap-2 ${tones[toast.tone] || tones.info}`}>
      {toast.msg}
    </div>
  ) : null;

  return { show, node };
}
