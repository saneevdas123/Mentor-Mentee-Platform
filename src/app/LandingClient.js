'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GooglyEyes from '@/components/GooglyEyes';

const TICKER = [
  'a mentee just uploaded their gradesheet',
  'weekly mentoring Meet is ready',
  'credit plan updated for CSE batch',
  'parent meeting scheduled this month',
  'branch change request waiting on mentor',
  'minutes saved after today’s session',
];

const CATCHES = [
  {
    title: 'Credits, clearly',
    body: 'Students (and mentors) can see what’s earned, what’s left, and which basket still needs work. No more “sir, how many credits do I need?” every week.',
    img: '/landing/landing-credits.png',
    bg: 'bg-accent-yellow',
  },
  {
    title: 'Meetings that stick',
    body: 'Weekly mentor–mentee calls and monthly parent meetings get a Meet link and a minutes draft. You edit if needed — the record doesn’t vanish in chat.',
    img: '/landing/landing-meetings.png',
    bg: 'bg-accent-mint',
  },
  {
    title: 'Reports for NAAC day',
    body: 'When IQAC asks for mentor–mentee ratio, counselling activity, or progression numbers, you print from here instead of hunting old Excels.',
    img: '/landing/landing-reports.png',
    bg: 'bg-accent-peach',
  },
];

const AUDIENCE = [
  { emoji: '🎓', title: 'Students', body: 'Check your credits, upload a gradesheet when asked, read what your mentor suggested, raise an issue, or request a branch change in first year.' },
  { emoji: '🧑‍🏫', title: 'Faculty mentors', body: 'One place for your mentees: profile, credits, gradesheet check, counselling notes, meetings, and issues. Less tab-hopping.' },
  { emoji: '🗂️', title: 'HoDs & Deans', body: 'Add mentors and students (or import from Excel), map who guides whom, set credit baskets, and clear branch-change requests.' },
  { emoji: '📋', title: 'Admin / IQAC', body: 'See coverage across schools and pull NAAC, NIRF, or NBA style reports when the committee needs them.' },
];

const STEPS = [
  { n: 1, color: 'bg-brand', title: 'Sign in with your CUTM login', body: 'Your HoD or admin creates the account and emails you. First time in, you set a new password. Then you’re on your dashboard.', img: '/landing/landing-mentor.png' },
  { n: 2, color: 'bg-[#58C6B1]', title: 'Do the day-to-day mentoring', body: 'HoDs assign mentees. Mentors counsel and meet. Students upload sheets and follow their credit plan. You only see your own school or department.', img: '/landing/landing-calendar.png' },
  { n: 3, color: 'bg-[#5B8DEF]', title: 'Keep proof ready', body: 'Meetings, minutes, counselling, and credit progress stay in the system. When reports are due, open NAAC / NIRF / NBA and print or save as PDF.', img: '/landing/landing-checklist.png' },
];

const FEATURES = [
  { emoji: '⏱️', title: 'Meetings on schedule', body: 'Weekly mentoring and monthly parent sessions can go out with a Meet link so nobody is asking “where’s the link?” in the group.' },
  { emoji: '📈', title: 'Credit tracker', body: 'See % done, credits left, and a simple on-track / may-delay view so the next semester plan is less of a guess.' },
  { emoji: '🔁', title: 'Smarter gradesheet review', body: 'The PDF is read for courses and grades. Mentors confirm the basket. Fixes are remembered next time that course shows up.' },
  { emoji: '🧠', title: 'Learner level', body: 'Slow / average / advanced hints help you prioritise. Mentors can override when they know the student better than the numbers.' },
];

const SKILLS = [
  { emoji: '🔎', title: 'Talk credits in plain words', body: 'Open the plan with the student. Point to the basket that’s short. Agree what to register next — then write it down in counselling.' },
  { emoji: '✍️', title: 'Leave a note after every talk', body: 'Two minutes after the Meet: what you advised, which credits to take. Later you (and IQAC) can see it happened.' },
  { emoji: '🖼️', title: 'Check the gradesheet once', body: 'Don’t just file the PDF. Confirm each course sits in the right basket so the tracker doesn’t lie.', },
  { emoji: '📡', title: 'Catch struggle early', body: 'Backlogs, risk flags, and learner level are clues. Reach out before the semester is already over.' },
  { emoji: '🎫', title: 'Don’t fear the committee mail', body: 'Ratio, minutes, and progression are already collected. Print the report instead of rebuilding it overnight.', },
];

const FAQ = [
  { q: 'Who can log in?', a: 'People with a CUTM Mentoring account: Admin, Dean, HoD, mentor, or student. Accounts are created by the level above you — students don’t sign up on their own.' },
  { q: 'Can other departments see our students?', a: 'No. You only see your school or department. Mentors only see the mentees mapped to them.' },
  { q: 'How do gradesheets work?', a: 'Upload a clear text PDF (not a photo scan). The system reads courses, credits, and grades, suggests a basket, and your mentor confirms before credits count.' },
  { q: 'What if Google Meet isn’t set up yet?', a: 'You can still use the app. Meetings and minutes work; the Meet link may use a simple fallback until campus Google access is connected.' },
  { q: 'Can we print for NAAC / NIRF / NBA?', a: 'Yes. Open the report pages and use Print / Save as PDF. You’ll get ratio, mentoring activity, progression, and at-risk views your team already tracks here.' },
  { q: 'Is this our ERP?', a: 'No. This is for mentoring and the evidence IQAC needs. ERP can connect later; you don’t need that to start using mentoring today.' },
];

function Logo({ size = 26, eyes = true }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-bold text-ink tracking-tight">
      {eyes ? (
        <GooglyEyes size={size} />
      ) : (
        <span
          className="inline-flex items-center justify-center rounded-xl bg-brand text-white border-2 border-ink shadow-hard-sm font-bold text-xs"
          style={{ width: size + 4, height: size + 4 }}
          aria-hidden
        >
          CM
        </span>
      )}
      <span>CUTM Mentoring</span>
    </Link>
  );
}

function SectionEyebrow({ children, dark }) {
  return (
    <p className={`text-center text-sm font-semibold italic mb-2 ${dark ? 'text-accent' : 'text-brand'}`}>
      {children}
    </p>
  );
}

function FaqItem({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="land-card card bg-white overflow-hidden">
      <button
        type="button"
        className="w-full text-left px-4 sm:px-5 py-4 flex items-start justify-between gap-3"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-bold text-[15px] leading-snug text-ink pr-2">{q}</span>
        <span
          className={`shrink-0 w-7 h-7 rounded-lg border-2 border-ink bg-cream flex items-center justify-center text-lg font-bold leading-none transition-transform ${open ? 'rotate-45 bg-accent-yellow' : ''}`}
          aria-hidden
        >
          +
        </span>
      </button>
      {open ? (
        <div className="px-4 sm:px-5 pb-4 -mt-1">
          <p className="text-sm text-ink/70 leading-relaxed border-t border-ink/10 pt-3">{a}</p>
        </div>
      ) : null}
    </div>
  );
}

function useReveal(rootRef) {
  useEffect(() => {
    document.documentElement.classList.add('js-landing');
    const root = rootRef.current;
    if (!root) return undefined;
    const nodes = Array.from(root.querySelectorAll('.reveal'));
    if (!nodes.length) return undefined;

    const show = (el) => el.classList.add('is-in');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -5% 0px', threshold: 0.08 }
    );
    nodes.forEach((n) => io.observe(n));

    // Safety: never leave sections invisible
    const fallback = window.setTimeout(() => nodes.forEach(show), 1200);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [rootRef]);
}

function useHeroTilt(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;

    function onMove(e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--tilt-y', `${px * 8}deg`);
      el.style.setProperty('--tilt-x', `${-py * 6}deg`);
    }
    function onLeave() {
      el.style.setProperty('--tilt-y', '0deg');
      el.style.setProperty('--tilt-x', '0deg');
    }
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref]);
}

const NAV = [
  { href: '#what', label: 'What you get' },
  { href: '#how', label: 'How it works' },
  { href: '#skills', label: 'Tips' },
  { href: '#faq', label: 'FAQ' },
];

function smoothScrollToHash(hash) {
  if (!hash || hash === '#') return false;
  const id = hash.startsWith('#') ? hash.slice(1) : hash;
  const el = document.getElementById(id);
  if (!el) return false;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('header.sticky');
  const offset = (header?.getBoundingClientRect().height || 72) + 8;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  try {
    window.history.pushState(null, '', `#${id}`);
  } catch {
    /* ignore */
  }
  return true;
}

function onHashNavClick(e, href, after) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  after?.();
  // wait 2 frames so mobile menu collapse updates sticky header height
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      smoothScrollToHash(href);
    });
  });
}

export default function LandingClient() {
  const pageRef = useRef(null);
  const tiltRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const ticker = [...TICKER, ...TICKER];
  useReveal(pageRef);
  useHeroTilt(tiltRef);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <div ref={pageRef} className="landing-page min-h-screen bg-cream text-ink overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Logo size={24} />
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="footer-link"
                onClick={(e) => onHashNavClick(e, n.href)}
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-primary hero-cta-shine !py-2 !px-4 sm:!px-5 text-sm">
              Sign in
            </Link>
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-ink bg-white shadow-hard-sm font-bold text-lg"
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav
            id="landing-mobile-nav"
            className="md:hidden border-t-2 border-ink bg-cream px-4 py-3 flex flex-col gap-1"
          >
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="font-semibold py-2.5 border-b border-ink/10"
                onClick={(e) => onHashNavClick(e, n.href, () => setMenuOpen(false))}
              >
                {n.label}
              </a>
            ))}
            <Link
              href="/login"
              className="btn-primary hero-cta-shine mt-2 !py-2.5 text-center"
              onClick={() => setMenuOpen(false)}
            >
              Sign in
            </Link>
          </nav>
        ) : null}
      </header>

      <div className="bg-ink text-cream overflow-hidden border-b-2 border-ink" aria-hidden>
        <div className="flex whitespace-nowrap landing-marquee py-1.5 text-xs sm:text-sm">
          {ticker.map((t, i) => (
            <span key={i} className="mx-2 sm:mx-3 inline-flex items-center gap-2 sm:gap-3">
              <span className="opacity-90">{t}</span>
              <span className="ticker-eyes" aria-hidden />
            </span>
          ))}
        </div>
      </div>

      {/* Hero — one viewport composition (Monitor YT style) */}
      <section className="hero-stage max-w-6xl mx-auto px-3 sm:px-4 pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-10 md:pb-14 grid md:grid-cols-2 gap-6 md:gap-10 items-start md:items-center">
        <div className="relative z-10 min-w-0 md:pt-1">
          <p className="hero-rise hero-d1 font-bold text-ink text-xl sm:text-2xl tracking-tight mb-1.5">
            CUTM Mentoring
          </p>
          <p className="hero-rise hero-d1 text-brand font-semibold italic text-[15px] mb-2.5">
            for mentors &amp; mentees on campus
          </p>
          <h1 className="hero-rise hero-d2 text-[1.65rem] sm:text-[2.2rem] md:text-[2.65rem] lg:text-[2.95rem] font-bold leading-[1.08] tracking-tight mb-3">
            One place for credits, counselling, and mentoring meetings.
          </h1>
          <p className="hero-rise hero-d3 text-ink/70 text-[15px] sm:text-base leading-relaxed mb-5 max-w-lg">
            Mentors keep mentee work in one dashboard. Students see their credit plan.
            When NAAC or IQAC asks for proof, the numbers are already here.
          </p>
          <div className="hero-rise hero-d4 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 mb-3 w-full sm:w-auto">
            <Link href="/login" className="btn-primary hero-cta-shine !px-5 !py-2.5 sm:!px-6 sm:!py-3 text-[15px] sm:text-base text-center w-full sm:w-auto">
              Sign in to your account
            </Link>
            <a
              href="#how"
              className="btn-ghost !px-5 !py-2.5 sm:!px-6 sm:!py-3 text-[15px] sm:text-base text-center w-full sm:w-auto"
              onClick={(e) => onHashNavClick(e, '#how')}
            >
              See how it works
            </a>
          </div>
          <p className="hero-rise hero-d5 text-sm text-ink/55">
            No public signup. Your HoD or admin sends the login.
          </p>
        </div>

        <div className="relative z-10 hero-panel w-full max-w-[22rem] sm:max-w-md mx-auto md:max-w-none md:mx-0 mt-1">
          <div
            className="absolute -top-3 right-5 sm:-top-3.5 sm:right-6 z-30"
            data-hero-eyes="true"
          >
            <GooglyEyes size={34} />
          </div>
          <div
            ref={tiltRef}
            className="hero-tilt hero-float relative rounded-neo border-2 border-ink shadow-hard-lg p-3.5 sm:p-4 md:p-5 bg-[radial-gradient(circle_at_1px_1px,#d6d0c4_1px,transparent_0)] [background-size:14px_14px] bg-accent-peach/50"
          >
            <div className="inline-flex items-center gap-2 bg-ink text-cream text-[10px] sm:text-xs font-bold tracking-wider px-2.5 py-1 rounded-md mb-3 shadow-hard-sm">
              <span className="hero-live-dot inline-block w-1.5 h-1.5 rounded-full bg-brand" />
              YOUR QUEUE
            </div>
            <div className="space-y-2.5">
              <div
                className="hero-card-float hero-feed-card relative bg-accent-yellow border-2 border-ink rounded-xl p-3 sm:p-3.5 shadow-hard cursor-default"
                style={{ '--hero-rot': '-1.5deg' }}
              >
                <div className="tape absolute -top-1.5 left-1/2 w-10 h-2.5 bg-white/80 border border-ink/20 rounded-sm" />
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-0.5">New gradesheet</div>
                <div className="font-semibold text-[13px] sm:text-sm leading-snug">Sem 3 sheet uploaded — please check baskets</div>
                <div className="text-[11px] text-ink/55 mt-1 inline-flex items-center gap-1.5">
                  <span className="hero-live-dot inline-block w-1.5 h-1.5 rounded-full bg-brand" />
                  just now · waiting on mentor
                </div>
              </div>
              <div
                className="hero-card-float hero-card-float-2 hero-feed-card relative bg-accent-mint border-2 border-ink rounded-xl p-3 sm:p-3.5 shadow-hard cursor-default"
                style={{ '--hero-rot': '1deg' }}
              >
                <div className="tape absolute -top-1.5 left-1/2 w-10 h-2.5 bg-white/80 border border-ink/20 rounded-sm" />
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-0.5">Credits updated</div>
                <div className="text-[13px] sm:text-sm line-through text-ink/45 leading-snug">12 credits still open in Program Core</div>
                <div className="font-semibold text-[13px] sm:text-sm leading-snug">8 left · looking on track</div>
                <div className="text-[11px] text-ink/55 mt-1">17 min ago · tracker refreshed</div>
              </div>
              <div
                className="hero-card-float hero-card-float-3 hero-feed-card relative bg-accent-pink border-2 border-ink rounded-xl p-3 sm:p-3.5 shadow-hard cursor-default"
                style={{ '--hero-rot': '-0.5deg' }}
              >
                <div className="tape absolute -top-1.5 left-1/2 w-10 h-2.5 bg-white/80 border border-ink/20 rounded-sm" />
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-0.5">Counselling note</div>
                <div className="font-semibold text-[13px] sm:text-sm leading-snug">Take 4 credits in Skill Enhancement next sem</div>
                <div className="text-[11px] text-ink/55 mt-1">2 hours ago · student can acknowledge</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="what" className="max-w-6xl mx-auto px-3 sm:px-4 py-12 sm:py-16">
        <div className="reveal">
          <SectionEyebrow>what actually goes in the system</SectionEyebrow>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
            The stuff you already do — kept in one place.
          </h2>
          <p className="text-center text-ink/65 max-w-2xl mx-auto mb-8 sm:mb-10 text-[15px] sm:text-base">
            Credits, meetings, and counselling notes shouldn’t live in five WhatsApp chats and a forgotten Drive folder.
            Put them here so you can find them again.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {CATCHES.map((c, i) => (
            <article key={c.title} className={`reveal reveal-d${i + 1} land-card card overflow-hidden ${c.bg}`}>
              <div className="land-card-media relative aspect-[5/4] border-b-2 border-ink bg-cream">
                <Image src={c.img} alt={c.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{c.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream py-12 sm:py-16 border-y-2 border-ink">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="reveal">
            <SectionEyebrow dark>who it’s for</SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
              Same campus, different jobs.
            </h2>
            <p className="text-center text-cream/65 max-w-2xl mx-auto mb-8 sm:mb-10 text-[15px] sm:text-base">
              Students check progress. Mentors guide. HoDs assign. Admin pulls reports. Everyone uses the login they were given.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {AUDIENCE.map((a, i) => (
              <div key={a.title} className={`reveal reveal-d${(i % 4) + 1} land-card-dark rounded-neo border border-cream/20 p-4 sm:p-5`}>
                <div className="text-2xl mb-3 land-card-icon inline-block">{a.emoji}</div>
                <h3 className="font-bold mb-2">{a.title}</h3>
                <p className="text-sm text-cream/65 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-3 sm:px-4 py-12 sm:py-16">
        <div className="reveal">
          <SectionEyebrow>three simple steps</SectionEyebrow>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
            Get in, do the work, keep the proof.
          </h2>
          <p className="text-center text-ink/65 max-w-2xl mx-auto mb-8 sm:mb-10 text-[15px] sm:text-base">
            You don’t configure a product for weeks. Your admin sets up the school tree; you use your role and move on with the semester.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((s, i) => (
            <article key={s.n} className={`reveal reveal-d${i + 1} land-card relative card bg-white overflow-hidden pt-0`}>
              <div className="land-card-media relative aspect-[5/4] border-b-2 border-ink bg-cream">
                <Image src={s.img} alt={s.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
              </div>
              <div className="p-5 pt-6 relative">
                <span className={`absolute -top-4 left-5 w-8 h-8 rounded-full ${s.color} text-white font-bold text-sm flex items-center justify-center border-2 border-ink shadow-hard-sm`}>
                  {s.n}
                </span>
                <h3 className="font-bold text-lg mb-2 mt-1">{s.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream py-12 sm:py-16 border-y-2 border-ink">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="reveal">
            <SectionEyebrow dark>handy every week</SectionEyebrow>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
              Small tools that save real time.
            </h2>
            <p className="text-center text-cream/65 max-w-2xl mx-auto mb-8 sm:mb-10 text-[15px] sm:text-base">
              CGPA alone doesn’t tell you what to do next. Credits, meetings, and a short counselling note do.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`reveal reveal-d${(i % 4) + 1} land-card-dark rounded-neo border border-cream/20 p-4 sm:p-5`}>
                <div className="text-2xl mb-3 land-card-icon inline-block">{f.emoji}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-cream/65 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="max-w-6xl mx-auto px-3 sm:px-4 py-12 sm:py-16">
        <div className="reveal">
          <SectionEyebrow>tips that stick</SectionEyebrow>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
            Make mentoring less messy.
          </h2>
          <p className="text-center text-ink/65 max-w-2xl mx-auto mb-8 sm:mb-10 text-[15px] sm:text-base">
            Talk credits clearly, leave a short note, check the sheet once, and follow up on risk early.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {SKILLS.map((s, i) => (
            <article
              key={s.title}
              className={`reveal reveal-d${(i % 3) + 1} land-card card p-4 sm:p-5 ${
                i % 3 === 0 ? 'bg-accent-yellow' : i % 3 === 1 ? 'bg-accent-mint' : 'bg-accent-peach'
              }`}
            >
              <div className="land-card-icon w-10 h-10 rounded-xl bg-white border-2 border-ink flex items-center justify-center text-lg mb-3 shadow-hard-sm">
                {s.emoji}
              </div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-3 sm:px-4 py-12 sm:py-16">
        <div className="reveal">
          <SectionEyebrow>quick answers</SectionEyebrow>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center tracking-tight mb-8 sm:mb-10">
            Questions we hear on campus
          </h2>
        </div>
        <div className="reveal space-y-3">
          {FAQ.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-3 sm:px-4 pb-12 sm:pb-16">
        <div className="reveal land-card relative card bg-accent-yellow p-6 sm:p-10 md:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Ready when your semester is.
          </h2>
          <p className="text-ink/70 max-w-xl mx-auto mb-6 sm:mb-8 text-[15px] sm:text-base">
            Sign in with the login you were given. Map mentees, track credits, hold meetings, and keep report data
            without starting another spreadsheet from scratch.
          </p>
          <Link href="/login" className="btn-primary hero-cta-shine !px-8 !py-3 inline-flex text-base w-full sm:w-auto justify-center">
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer border-t-2 border-ink">
        <div className="landing-footer-bar" />
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-10 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-10 text-sm mb-8 sm:mb-10">
            <div className="sm:col-span-2 md:col-span-5">
              <Logo size={28} eyes={false} />
              <p className="text-brand italic font-semibold mt-4 text-base leading-snug max-w-sm">
                Mentoring that doesn’t get lost in email
              </p>
              <p className="text-ink/55 mt-3 max-w-sm leading-relaxed">
                Credits, counselling, meetings, and campus reports for Centurion University — in one login.
              </p>
              <Link href="/login" className="btn-primary hero-cta-shine mt-5 inline-flex !px-5 !py-2.5">
                Sign in
              </Link>
            </div>
            <div className="md:col-span-2">
              <div className="font-bold uppercase text-xs tracking-wider mb-3 text-ink/45">On this page</div>
              <ul className="space-y-2.5 font-semibold">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <a
                      href={n.href}
                      className="footer-link"
                      onClick={(e) => onHashNavClick(e, n.href)}
                    >
                      {n.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2">
              <div className="font-bold uppercase text-xs tracking-wider mb-3 text-ink/45">For campus</div>
              <ul className="space-y-2.5 font-medium text-ink/75">
                <li>NAAC · NIRF · NBA</li>
                <li>CBCS credit tracker</li>
                <li>Weekly / monthly Meets</li>
                <li>Learner levels</li>
              </ul>
            </div>
            <div className="sm:col-span-2 md:col-span-3">
              <div className="font-bold uppercase text-xs tracking-wider mb-3 text-ink/45">University</div>
              <div className="land-card card bg-cream overflow-hidden shadow-hard-sm p-4 flex flex-col items-center text-center max-w-xs mx-auto sm:mx-0">
                <Image
                  src="/cutm-logo.png"
                  alt="Centurion University"
                  width={120}
                  height={185}
                  className="h-[96px] sm:h-[120px] w-auto object-contain"
                  priority={false}
                />
                <div className="font-bold text-sm text-ink mt-3">Centurion University</div>
                <div className="text-ink/55 text-xs mt-0.5">of Technology and Management</div>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-dashed border-ink/20 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-ink/50">
            <span>© {new Date().getFullYear()} CUTM Mentor–Mentee Platform</span>
            <span className="font-medium">Made for CUTM mentoring teams.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
