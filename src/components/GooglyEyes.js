'use client';

import { useEffect, useRef } from 'react';

/** Cursor-tracking googly eyes with occasional, calm blinks. */
export default function GooglyEyes({ size = 28, className = '' }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const max = Math.max(3, size * 0.26);
    const pupil = Math.max(9, Math.round(size * 0.38));
    wrap.dataset.eyesReady = reduce ? 'reduced' : 'tracking';

    const pupils = () => wrap.querySelectorAll('[data-pupil="true"]');
    const lids = () => wrap.querySelectorAll('[data-lid="true"]');

    pupils().forEach((p) => {
      p.style.width = `${pupil}px`;
      p.style.height = `${pupil}px`;
    });

    const place = (x, y) => {
      wrap.dataset.pupilX = String(x.toFixed(2));
      wrap.dataset.pupilY = String(y.toFixed(2));
      const tr = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), 0)`;
      pupils().forEach((p) => {
        p.style.transform = tr;
      });
    };

    place(0, 0);
    if (reduce) return undefined;

    let raf = 0;
    let blinkClose = 0;
    let nextBlink = 0;
    let blinking = false;
    let lastBlink = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let lastMove = 0;

    const onMove = (e) => {
      lastMove = performance.now();
      const r = wrap.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, dist / 140);
      tx = (dx / dist) * max * pull;
      ty = (dy / dist) * max * pull;
    };

    const tick = () => {
      // softer follow — less twitchy while moving around
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      if (performance.now() - lastMove > 2800) {
        tx *= 0.96;
        ty *= 0.96;
      }
      place(cx, cy);
      raf = requestAnimationFrame(tick);
    };

    const scheduleBlink = () => {
      // natural gap: ~4.5–8s, never stacks while already blinking
      const delay = 4500 + Math.random() * 3500;
      nextBlink = window.setTimeout(() => {
        blink();
      }, delay);
    };

    const blink = () => {
      const now = performance.now();
      if (blinking || now - lastBlink < 3200) {
        scheduleBlink();
        return;
      }
      blinking = true;
      lastBlink = now;
      wrap.dataset.blinking = '1';
      lids().forEach((lid) => {
        lid.style.transform = 'scaleY(1)';
      });
      window.clearTimeout(blinkClose);
      blinkClose = window.setTimeout(() => {
        lids().forEach((lid) => {
          lid.style.transform = 'scaleY(0)';
        });
        wrap.dataset.blinking = '0';
        blinking = false;
        scheduleBlink();
      }, 120);
    };

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    let idleLook = 0;
    if (coarse) {
      // slow, subtle look-around on touch devices only
      idleLook = window.setInterval(() => {
        const a = (performance.now() / 2800) % (Math.PI * 2);
        tx = Math.cos(a) * max * 0.45;
        ty = Math.sin(a * 0.7) * max * 0.28;
      }, 120);
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    // first blink after a calm beat — not on hover/click
    nextBlink = window.setTimeout(blink, 2800 + Math.random() * 1200);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      window.clearTimeout(nextBlink);
      window.clearTimeout(blinkClose);
      window.clearInterval(idleLook);
    };
  }, [size]);

  const pupil = Math.max(9, Math.round(size * 0.38));

  return (
    <span
      ref={wrapRef}
      data-googly-eyes="true"
      className={`inline-flex items-center gap-[3px] pointer-events-none ${className}`}
      aria-hidden
      style={{ lineHeight: 0 }}
    >
      {[0, 1].map((i) => (
        <span
          key={i}
          className="relative inline-block overflow-hidden rounded-full bg-white border-2 border-ink shadow-hard-sm"
          style={{ width: size, height: size }}
        >
          <span
            data-pupil="true"
            className="absolute left-1/2 top-1/2 block rounded-full bg-ink"
            style={{ width: pupil, height: pupil, willChange: 'transform' }}
          />
          <span
            data-lid="true"
            className="absolute inset-0 origin-top bg-ink pointer-events-none"
            style={{ transform: 'scaleY(0)', transition: 'transform 90ms ease' }}
          />
        </span>
      ))}
    </span>
  );
}
