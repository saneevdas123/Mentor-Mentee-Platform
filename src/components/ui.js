'use client';

import { useEffect, useId, useRef, useState } from 'react';

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

/** Consistent page title block for every role dashboard */
export function PageHead({ title, subtitle, eyebrow }) {
  return (
    <header className="mb-5 sm:mb-6">
      {eyebrow ? (
        <p className="text-brand font-semibold italic text-sm mb-1">{eyebrow}</p>
      ) : null}
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink leading-tight">{title}</h1>
      {subtitle ? (
        <p className="text-ink/55 mt-1.5 text-sm leading-relaxed max-w-2xl">{subtitle}</p>
      ) : null}
    </header>
  );
}

/** Horizontally scrollable tab strip (phones + dense HoD tabs) */
export function TabBar({ children, className = '' }) {
  return (
    <div className={`shell-tabs mb-4 ${className}`} role="tablist">
      {children}
    </div>
  );
}

/** Calm underline tab — shared across all role dashboards */
export function Tab({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={!!active}
      className={`ui-tab${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Stat({ label, value, sub, tone = 'brand' }) {
  // Keep neo card frame (matches theme). Label/sub stay plain text — no inner chips.
  return (
    <div className={`card p-3.5 sm:p-5 ${STAT_ACCENTS[tone] || STAT_ACCENTS.brand}`}>
      <div className="text-[10px] sm:text-xs font-bold text-ink/55 uppercase tracking-wide">{label}</div>
      <div className={`mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-bold tracking-tight ${STAT_TEXT[tone] || STAT_TEXT.brand}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs font-medium text-ink/55">{sub}</div> : null}
    </div>
  );
}

export function Card({ title, subtitle, actions, children, className = '', accent }) {
  const accents = {
    yellow: 'bg-accent-yellow',
    mint: 'bg-accent-mint',
    peach: 'bg-accent-peach',
    pink: 'bg-accent-pink',
  };
  return (
    <div className={`card overflow-hidden ${accent ? accents[accent] || '' : 'bg-white'} ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3 border-b border-ink/10">
          <div className="min-w-0">
            {title ? <h3 className="font-bold text-ink">{title}</h3> : null}
            {subtitle ? <p className="text-xs text-ink/50 mt-0.5 leading-snug">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2 shrink-0">{actions}</div> : null}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

const FIELD_SELECTOR = [
  'input:not([disabled]):not([type="hidden"]):not([type="submit"]):not([type="button"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
].join(', ');

function modalFields(root) {
  return [...(root?.querySelectorAll(FIELD_SELECTOR) || [])];
}

/**
 * Enter in a text field must not submit the modal form or activate Close.
 * Browsers treat Enter in an <input> as "submit" (which closes the dialog).
 * Login is a full page, not a Modal — it is unchanged.
 */
function onModalEnter(e) {
  if (e.key !== 'Enter' || e.defaultPrevented || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const el = e.target;
  if (!(el instanceof HTMLElement)) return;
  if (el.closest('textarea') || el.tagName === 'TEXTAREA') return;
  if (el.matches('button, [type="submit"], a[href]')) return;
  if (!el.matches('input, select')) return;

  e.preventDefault();
  e.stopPropagation();

  const root = el.closest('[role="dialog"]');
  const fields = modalFields(root);
  const i = fields.indexOf(el);
  if (i >= 0 && i < fields.length - 1) fields[i + 1].focus();
}

/** Polished modal used by every role — focus, escape, scroll lock, sticky chrome */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
  footer,
  nested = false,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      const root = panelRef.current;
      if (!root) return;
      // Never focus × first — Enter on that button closes the dialog ("goes back").
      const body = root.querySelector('.ui-modal-body');
      const firstField = modalFields(body)[0];
      (firstField || body?.querySelector('button:not([disabled])'))?.focus?.();
    }, 30);

    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`ui-modal-backdrop no-print${nested ? ' ui-modal-backdrop--nested' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`ui-modal-panel ${wide ? 'ui-modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onModalEnter}
      >
        <div className="ui-modal-head">
          <div className="min-w-0 pr-3">
            <h3 id={titleId} className="font-bold text-ink text-lg leading-tight">{title}</h3>
            {description ? (
              <p id={descId} className="text-sm text-ink/55 mt-1 leading-snug">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
        {footer ? <div className="ui-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Label + control + optional hint — clearer than bare inputs */
export function Field({
  label,
  children,
  hint,
  optional,
  htmlFor,
  className = '',
}) {
  return (
    <div className={`ui-field ${className}`}>
      {label ? (
        <label className="label" htmlFor={htmlFor}>
          <span>{label}</span>
          {optional ? <span className="ui-field-optional">optional</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <p className="ui-field-hint">{hint}</p> : null}
    </div>
  );
}

/** Two-column field grid inside modals */
export function FieldGrid({ children }) {
  return <div className="ui-field-grid">{children}</div>;
}

export function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-ink/8 text-ink/70',
    green: 'bg-accent-mint text-ink',
    red: 'bg-accent-pink text-ink',
    amber: 'bg-accent-yellow text-ink',
    blue: 'bg-sky-100 text-ink',
    brand: 'bg-brand-light text-ink',
  };
  return <span className={`badge ${tones[tone] || tones.gray}`}>{children}</span>;
}

export function riskTone(r) { return r === 'HIGH' ? 'red' : r === 'MEDIUM' ? 'amber' : 'green'; }
export function statusTone(s) {
  return ({
    OPEN: 'amber', IN_PROGRESS: 'blue', RESOLVED: 'green', CLOSED: 'gray', ESCALATED: 'red',
    SCHEDULED: 'blue', NOTIFIED: 'brand', COMPLETED: 'green', CANCELLED: 'gray',
    REQUESTED: 'amber', COUNSELLED: 'blue', RECOMMENDED: 'green', NOT_RECOMMENDED: 'red',
    APPROVED: 'green', REJECTED: 'red', WITHDRAWN: 'gray',
  })[s] || 'gray';
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (m, t = 3000) => { setMsg(m); setTimeout(() => setMsg(null), t); };
  const node = msg ? (
    <div className="fixed bottom-4 right-4 z-50 bg-ink text-cream text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg no-print max-w-sm">
      {msg}
    </div>
  ) : null;
  return { show, node };
}
