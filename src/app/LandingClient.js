'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import GooglyEyes from '@/components/GooglyEyes';

const TICKER = [
  'mentor flagged a high-risk mentee',
  'gradesheet uploaded — needs review',
  'weekly Meet link created',
  'credit counselling logged',
  'branch-change request raised',
  'NAAC ratio updated',
];

const CATCHES = [
  {
    title: 'Credit progress',
    body: 'Basket-wise earned vs required credits, remaining load, and what to take next — so mentees stop guessing their CBCS plan.',
    img: '/landing/landing-credits.png',
    bg: 'bg-accent-yellow',
  },
  {
    title: 'Mentoring sessions',
    body: 'Weekly mentor–mentee Meets and monthly parent meetings, with minutes auto-drafted and stored for the audit trail.',
    img: '/landing/landing-meetings.png',
    bg: 'bg-accent-mint',
  },
  {
    title: 'Accreditation evidence',
    body: 'One-click NAAC, NIRF and NBA views that map onto mentor:mentee ratio, progression, and at-risk intervention.',
    img: '/landing/landing-reports.png',
    bg: 'bg-accent-peach',
  },
];

const AUDIENCE = [
  { emoji: '🎓', title: 'Student mentees', body: 'See your credit tracker, upload gradesheets, read counselling notes, raise issues, and request a branch change in first year.' },
  { emoji: '🧑‍🏫', title: 'Faculty mentors', body: 'Run the mentoring workspace — profiles, gradesheet review, counselling, meetings, minutes, and issue responses in one place.' },
  { emoji: '🗂️', title: 'HoDs & Deans', body: 'Provision mentors, import students, map mentees, set baskets & credit plans, and decide branch-change requests.' },
  { emoji: '📋', title: 'IQAC / Admin', body: 'Watch school-wide coverage and print NAAC / NIRF / NBA reports without rebuilding spreadsheets every cycle.' },
];

const STEPS = [
  { n: 1, color: 'bg-brand', title: 'Sign in', body: 'Use the credentials provisioned for your role. First login asks for a new password — then you land on your dashboard.' },
  { n: 2, color: 'bg-[#58C6B1]', title: 'Your mentoring loop', body: 'HoDs map mentees. Mentors counsel and schedule. Students upload gradesheets and track credits. Everything stays scoped to your school.' },
  { n: 3, color: 'bg-[#5B8DEF]', title: 'Review the evidence', body: 'Meetings, minutes, counselling logs, and credit progress feed NAAC / NIRF / NBA reports you can print or save as PDF.' },
];

const FEATURES = [
  { emoji: '⏱️', title: 'Meetings on a clock', body: 'Weekly mentoring and monthly parent sessions with Google Meet links and emailed invites.' },
  { emoji: '📈', title: 'Credit tracker that projects', body: 'See completion %, remaining credits, and an on-track / at-risk of delay signal.' },
  { emoji: '🔁', title: 'Gradesheet memory', body: 'Parsed courses map to baskets; mentor fixes stick so the next PDF is faster to verify.' },
  { emoji: '🧠', title: 'Learner levels', body: 'Slow / average / advanced signals with mentor override — so support is targeted, not guesswork.' },
];

const SKILLS = [
  { emoji: '🔎', title: 'Read a credit plan', body: 'Learn how baskets, required credits, and “what to take next” turn CBCS into a weekly conversation.' },
  { emoji: '✍️', title: 'Counsel with a record', body: 'Capture advice, recommended credits, and acknowledgements so every session is evidence, not memory.' },
  { emoji: '🖼️', title: 'Verify gradesheets', body: 'Confirm course→basket mapping, catch unassigned credits, and keep the tracker honest.' },
  { emoji: '📡', title: 'Spot at-risk early', body: 'Use risk flags, backlogs, and learner level to intervene before a semester is lost.' },
  { emoji: '🎫', title: 'Report without panic', body: 'Pull mentor:mentee ratio, minutes coverage, and progression metrics when IQAC asks.' },
];

const FAQ = [
  { q: 'Who can use this platform?', a: 'CUTM roles only: Admin, Dean, HoD, Faculty Mentor, and Student Mentee. Each account is provisioned by the level above — students do not self-register.' },
  { q: 'Is student data shared across campuses?', a: 'No. Queries are scoped to the signed-in user’s school and department. Mentors only see their mapped mentees.' },
  { q: 'How do gradesheets work?', a: 'Students upload a text-based PDF. The parser extracts courses, credits, and grades, suggests baskets, and the mentor verifies before credits count.' },
  { q: 'What about meetings if Google isn’t connected?', a: 'The app still runs. Meet links fall back to a shared room pattern, and emails log to the console until SMTP is configured.' },
  { q: 'Can we print for NAAC / NIRF / NBA?', a: 'Yes. Report pages are print-ready (Save as PDF). They cover mentor:mentee ratio, mentoring activity, progression, and OBE/at-risk views.' },
  { q: 'Does it replace the ERP?', a: 'No — it is the mentoring + accreditation layer. The data model is built so ERP sync can plug in later without a rewrite.' },
];

function Logo({ size = 26 }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2 font-bold text-ink tracking-tight">
      <GooglyEyes size={size} />
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

function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const nodes = root.querySelectorAll('.reveal');
    if (!nodes.length) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
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

export default function LandingClient() {
  const pageRef = useRef(null);
  const tiltRef = useRef(null);
  const ticker = [...TICKER, ...TICKER];
  useReveal(pageRef);
  useHeroTilt(tiltRef);

  return (
    <div ref={pageRef} className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <a href="#what" className="footer-link">What it catches</a>
            <a href="#how" className="footer-link">How it works</a>
            <a href="#skills" className="footer-link">Grow skills</a>
            <a href="#faq" className="footer-link">FAQ</a>
          </nav>
          <Link href="/login" className="btn-primary hero-cta-shine !py-2 !px-5 text-sm">Open app</Link>
        </div>
      </header>

      <div className="bg-ink text-cream overflow-hidden border-b-2 border-ink">
        <div className="flex whitespace-nowrap landing-marquee py-2 text-sm">
          {ticker.map((t, i) => (
            <span key={i} className="mx-3 inline-flex items-center gap-3">
              <span className="opacity-90">{t}</span>
              <span className="text-brand font-bold">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="hero-stage max-w-6xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative z-10">
          <p className="hero-rise hero-d1 text-brand font-bold text-sm tracking-wide mb-3">structured mentoring for CUTM 🔎</p>
          <h1 className="hero-rise hero-d2 text-4xl md:text-[3.35rem] font-bold leading-[1.05] tracking-tight mb-5">
            See every credit, counselling, and meeting move your mentees make.
          </h1>
          <p className="hero-rise hero-d3 text-ink/70 text-base md:text-lg leading-relaxed mb-6 max-w-xl">
            CUTM Mentoring connects profiles, CBCS credit plans, gradesheets, weekly Meets, and
            accreditation reports — so mentors coach with evidence and IQAC prints without panic.
          </p>
          <div className="hero-rise hero-d4 flex flex-wrap gap-2 mb-7">
            {['NAAC-ready', 'Credit tracker', 'Auto Meet + minutes'].map((chip) => (
              <span key={chip} className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold shadow-hard-sm">
                {chip}
              </span>
            ))}
          </div>
          <div className="hero-rise hero-d4 flex flex-wrap gap-3 mb-4">
            <Link href="/login" className="btn-primary hero-cta-shine !px-6 !py-3 text-base">Start mentoring — sign in</Link>
            <a href="#how" className="btn-ghost !px-6 !py-3 text-base">How it works</a>
          </div>
          <p className="hero-rise hero-d5 text-sm text-ink/55">Role-based access. Credentials come from your HoD / Admin — no public signup.</p>
        </div>

        <div className="relative z-10 hero-panel">
          <div className="absolute -top-3 right-6 z-20 hero-eyes-bob">
            <GooglyEyes size={38} />
          </div>
          <div
            ref={tiltRef}
            className="hero-tilt hero-float relative rounded-neo border-2 border-ink shadow-hard-lg p-5 md:p-6 bg-[radial-gradient(circle_at_1px_1px,#d6d0c4_1px,transparent_0)] [background-size:14px_14px] bg-accent-peach/50"
          >
            <div className="inline-flex items-center gap-2 bg-ink text-cream text-xs font-bold tracking-wider px-3 py-1.5 rounded-md mb-4 shadow-hard-sm">
              <span className="hero-live-dot inline-block w-1.5 h-1.5 rounded-full bg-brand" />
              MENTORING FEED
              <span className="ml-1 rounded bg-brand px-1.5 py-0.5 text-[10px] tracking-normal">LIVE</span>
            </div>
            <div className="space-y-3">
              <div
                className="hero-card-float hero-feed-card relative bg-accent-yellow border-2 border-ink rounded-xl p-4 shadow-hard cursor-default"
                style={{ '--hero-rot': '-1.5deg' }}
              >
                <div className="tape absolute -top-2 left-1/2 w-12 h-3 bg-white/80 border border-ink/20 rounded-sm" />
                <div className="text-xs font-bold uppercase tracking-wide mb-1">New gradesheet</div>
                <div className="font-semibold text-sm">“Sem 3 result sheet — needs basket map”</div>
                <div className="text-xs text-ink/55 mt-1 inline-flex items-center gap-1.5">
                  <span className="hero-live-dot inline-block w-1.5 h-1.5 rounded-full bg-brand" />
                  just now · topic added to your feed
                </div>
              </div>
              <div
                className="hero-card-float hero-card-float-2 hero-feed-card relative bg-accent-mint border-2 border-ink rounded-xl p-4 shadow-hard cursor-default"
                style={{ '--hero-rot': '1deg' }}
              >
                <div className="tape absolute -top-2 left-1/2 w-12 h-3 bg-white/80 border border-ink/20 rounded-sm" />
                <div className="text-xs font-bold uppercase tracking-wide mb-1">Credit switch</div>
                <div className="text-sm line-through text-ink/45">12 credits still open in Program Core</div>
                <div className="font-semibold text-sm">8 remaining · on track this semester</div>
                <div className="text-xs text-ink/55 mt-1">17 min ago · tracker updated</div>
              </div>
              <div
                className="hero-card-float hero-card-float-3 hero-feed-card relative bg-accent-pink border-2 border-ink rounded-xl p-4 shadow-hard cursor-default"
                style={{ '--hero-rot': '-0.5deg' }}
              >
                <div className="tape absolute -top-2 left-1/2 w-12 h-3 bg-white/80 border border-ink/20 rounded-sm" />
                <div className="text-xs font-bold uppercase tracking-wide mb-1">Counselling logged</div>
                <div className="font-semibold text-sm">“Take 4 cr Skill Enhancement next”</div>
                <div className="text-xs text-ink/55 mt-1">2 hours ago · student can acknowledge</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="what" className="max-w-6xl mx-auto px-4 py-16">
        <div className="reveal">
          <SectionEyebrow>raw data is easy. signal is hard.</SectionEyebrow>
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
            Turn mentoring activity into research signal.
          </h2>
          <p className="text-center text-ink/65 max-w-2xl mx-auto mb-10">
            Spreadsheets show snapshots. CUTM Mentoring keeps the sequence — who met whom, what changed in credits,
            and what evidence IQAC can print.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {CATCHES.map((c, i) => (
            <article key={c.title} className={`reveal reveal-d${i + 1} land-card card overflow-hidden ${c.bg}`}>
              <div className="land-card-media relative h-44 border-b-2 border-ink bg-cream">
                <Image src={c.img} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{c.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream py-16 border-y-2 border-ink">
        <div className="max-w-6xl mx-auto px-4">
          <div className="reveal">
            <SectionEyebrow dark>built for people who mentor</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
              Made for campuses that study the game.
            </h2>
            <p className="text-center text-cream/65 max-w-2xl mx-auto mb-10">
              If you publish outcomes for NAAC, NIRF or NBA, the mentoring trail around every student is your best research material.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AUDIENCE.map((a, i) => (
              <div key={a.title} className={`reveal reveal-d${(i % 4) + 1} land-card-dark rounded-neo border border-cream/20 p-5`}>
                <div className="text-2xl mb-3 land-card-icon inline-block">{a.emoji}</div>
                <h3 className="font-bold mb-2">{a.title}</h3>
                <p className="text-sm text-cream/65 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="max-w-6xl mx-auto px-4 py-16">
        <div className="reveal">
          <SectionEyebrow>honestly, it&apos;s three steps</SectionEyebrow>
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
            Set the hierarchy. Then it just watches.
          </h2>
          <p className="text-center text-ink/65 max-w-2xl mx-auto mb-10">
            No setup headaches for mentees. Admin → Dean → HoD provisions the next level; mentors and students get to work.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <article key={s.n} className={`reveal reveal-d${i + 1} land-card relative card bg-white p-6 pt-8`}>
              <span className={`absolute -top-3 left-5 w-8 h-8 rounded-full ${s.color} text-white font-bold text-sm flex items-center justify-center border-2 border-ink shadow-hard-sm`}>
                {s.n}
              </span>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream py-16 border-y-2 border-ink">
        <div className="max-w-6xl mx-auto px-4">
          <div className="reveal">
            <SectionEyebrow dark>the timeline changes the analysis</SectionEyebrow>
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
              See the change and the response curve.
            </h2>
            <p className="text-center text-cream/65 max-w-2xl mx-auto mb-10">
              A static CGPA tells you where a student is. The mentoring feed shows when credits moved, when counselling happened, and what to try next.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`reveal reveal-d${(i % 4) + 1} land-card-dark rounded-neo border border-cream/20 p-5`}>
                <div className="text-2xl mb-3 land-card-icon inline-block">{f.emoji}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-cream/65 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="skills" className="max-w-6xl mx-auto px-4 py-16">
        <div className="reveal">
          <SectionEyebrow>learn the mentoring workflow</SectionEyebrow>
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-3">
            How to improve mentoring skill
          </h2>
          <p className="text-center text-ink/65 max-w-2xl mx-auto mb-10">
            Build a repeatable loop: spot patterns, counsel with a record, verify gradesheets, and turn activity into accreditation evidence.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SKILLS.map((s, i) => (
            <article
              key={s.title}
              className={`reveal reveal-d${(i % 3) + 1} land-card card p-5 ${
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

      <section id="faq" className="max-w-6xl mx-auto px-4 py-16">
        <div className="reveal">
          <SectionEyebrow>the questions everyone asks</SectionEyebrow>
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-10">
            Frequently asked questions
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FAQ.map((f, i) => (
            <article
              key={f.q}
              className={`reveal reveal-d${(i % 3) + 1} land-card card p-5 ${
                i < 3
                  ? i === 0
                    ? 'bg-accent-yellow'
                    : i === 1
                      ? 'bg-accent-mint'
                      : 'bg-accent-pink'
                  : 'bg-white'
              }`}
            >
              <h3 className="font-bold mb-2 text-[15px] leading-snug">{f.q}</h3>
              <p className="text-sm text-ink/70 leading-relaxed">{f.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="reveal land-card relative card bg-accent-yellow p-10 md:p-14 text-center">
          <div className="absolute bottom-4 right-6 hidden sm:block hero-eyes-bob">
            <GooglyEyes size={42} />
          </div>
          <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Turn your department into a mentoring system.
          </h2>
          <p className="relative text-ink/70 max-w-xl mx-auto mb-8">
            Start with demo or provisioned credentials. Move from mapping mentees to credit counselling,
            minutes, and print-ready accreditation reports.
          </p>
          <Link href="/login" className="relative btn-primary hero-cta-shine !px-8 !py-3 inline-flex text-base">
            Open the app — it&apos;s ready
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer border-t-2 border-ink">
        <div className="landing-footer-bar" />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-12 gap-10 text-sm mb-10">
            <div className="md:col-span-5">
              <Logo size={28} />
              <p className="text-brand italic font-semibold mt-4 text-base leading-snug max-w-sm">
                know your mentees before the semester does 👀
              </p>
              <p className="text-ink/55 mt-3 max-w-sm leading-relaxed">
                Mentoring, credits, meetings, and accreditation evidence — one cream-and-coral system for CUTM.
              </p>
              <Link href="/login" className="btn-primary hero-cta-shine mt-5 inline-flex !px-5 !py-2.5">
                Open app
              </Link>
            </div>
            <div className="md:col-span-2">
              <div className="font-bold uppercase text-xs tracking-wider mb-3 text-ink/45">Product</div>
              <ul className="space-y-2.5 font-semibold">
                <li><a href="#what" className="footer-link">What it catches</a></li>
                <li><a href="#how" className="footer-link">How it works</a></li>
                <li><a href="#skills" className="footer-link">Grow skills</a></li>
                <li><a href="#faq" className="footer-link">FAQ</a></li>
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
            <div className="md:col-span-3">
              <div className="font-bold uppercase text-xs tracking-wider mb-3 text-ink/45">University</div>
              <div className="card bg-white p-4 shadow-hard-sm">
                <div className="font-bold">Centurion University</div>
                <div className="text-ink/60 text-xs mt-1">of Technology and Management</div>
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink/50">
                  <GooglyEyes size={18} />
                  Watching every mentoring move
                </div>
              </div>
            </div>
          </div>
          <div className="border-t-2 border-dashed border-ink/20 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-ink/50">
            <span>© {new Date().getFullYear()} CUTM Mentor–Mentee Platform</span>
            <span className="font-medium">Built for mentors who ship evidence, not excuses.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
