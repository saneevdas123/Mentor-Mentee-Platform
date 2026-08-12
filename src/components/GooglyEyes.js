'use client';

import { useEffect, useRef } from 'react';

/** Pair of googly eyes that look toward the cursor (rAF-throttled). */
export default function GooglyEyes({ size = 28, className = '' }) {
  const wrapRef = useRef(null);
  const p1 = useRef(null);
  const p2 = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;

    const max = size * 0.22;

    function onMove(e) {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, dist / 140);
      target.current = {
        x: (dx / dist) * max * pull,
        y: (dy / dist) * max * pull,
      };
    }

    function tick() {
      const t = target.current;
      const c = current.current;
      c.x += (t.x - c.x) * 0.22;
      c.y += (t.y - c.y) * 0.22;
      const tr = `translate(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px)`;
      if (p1.current) p1.current.style.transform = tr;
      if (p2.current) p2.current.style.transform = tr;
      raf.current = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [size]);

  const pupil = size * 0.38;

  return (
    <span ref={wrapRef} className={`inline-flex items-center gap-1 ${className}`} aria-hidden>
      {[p1, p2].map((ref, i) => (
        <span
          key={i}
          className="relative inline-flex items-center justify-center rounded-full bg-white border-2 border-ink shadow-hard-sm"
          style={{ width: size, height: size }}
        >
          <span
            ref={ref}
            className="absolute rounded-full bg-ink"
            style={{ width: pupil, height: pupil, willChange: 'transform' }}
          />
        </span>
      ))}
    </span>
  );
}
