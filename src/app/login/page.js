'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import GooglyEyes from '@/components/GooglyEyes';

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder = '••••••••',
  disabled,
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          className="input pr-12"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 px-3 flex items-center text-ink/55 hover:text-ink"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={0}
        >
          {show ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10.6 10.7a2 2 0 002.8 2.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path
                d="M9.9 5.1A10.8 10.8 0 0112 5c5.2 0 9.2 3.4 10.5 7-.4 1.1-1 2.1-1.8 3M6.1 6.1C4 7.6 2.6 9.6 1.5 12c1.3 3.6 5.3 7 10.5 7 1.4 0 2.7-.2 3.9-.7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M1.5 12C2.8 8.4 6.8 5 12 5s9.2 3.4 10.5 7c-1.3 3.6-5.3 7-10.5 7S2.8 15.6 1.5 12z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [changeMode, setChangeMode] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [home, setHome] = useState('/');

  async function onLogin(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setHome(data.home);
      if (data.user.mustChangePassword) setChangeMode(true);
      else router.push(data.home);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onChange(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(home);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      {/* Top branding — same language as landing */}
      <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b-2 border-ink">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight">
            <GooglyEyes size={24} />
            <span>CUTM Mentoring</span>
          </Link>
          <Link href="/" className="btn-ghost !py-2 !px-4 text-sm">
            Back to home
          </Link>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-2">
        {/* Brand panel with CUTM logo */}
        <div className="relative hidden md:flex flex-col justify-between bg-ink text-cream p-10 border-r-2 border-ink overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #FDF8F0 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
            aria-hidden
          />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="rounded-neo border-2 border-cream/30 bg-cream p-3 shadow-hard-sm">
                <Image
                  src="/cutm-logo.png"
                  alt="Centurion University"
                  width={72}
                  height={110}
                  className="h-16 w-auto object-contain"
                  priority
                />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-accent">CUTM</div>
                <div className="font-semibold text-sm leading-snug text-cream/90 max-w-[12rem]">
                  Centurion University of Technology and Management
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight">
              Mentor–Mentee
              <br />
              Platform
            </h1>
            <p className="text-cream/70 mt-5 max-w-sm text-sm leading-relaxed">
              Credits, counselling, meetings, and campus reports — in one login for mentors and mentees.
            </p>
          </div>
          <ul className="relative z-10 text-sm text-cream/80 space-y-3 mt-10">
            {[
              'Admin → Dean → HoD → Mentor → Student hierarchy',
              'Weekly mentoring Meets & minutes',
              'NAAC / NIRF / NBA ready reports',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-brand font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="md:hidden flex flex-col items-center text-center mb-6">
              <div className="rounded-neo border-2 border-ink bg-white p-3 shadow-hard-sm mb-3">
                <Image
                  src="/cutm-logo.png"
                  alt="Centurion University"
                  width={64}
                  height={98}
                  className="h-14 w-auto object-contain"
                  priority
                />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-ink/45">Centurion University</div>
            </div>

            <div
              className={`login-board${loading ? ' is-loading' : ''}`}
              aria-busy={loading}
            >
              <div className="login-board-inner">
                <h2 className="text-2xl font-bold mb-1">
                  {changeMode ? 'Set a new password' : 'Sign in'}
                </h2>
                <p className="text-sm text-ink/60 mb-6">
                  {changeMode
                    ? 'This is your first login. Please choose a secure password.'
                    : 'Use the credentials sent to your email.'}
                </p>

                {err && (
                  <div className="mb-4 text-sm text-ink ui-callout-danger px-3 py-2">
                    {err}
                  </div>
                )}

                {!changeMode ? (
                  <form onSubmit={onLogin} className="space-y-4">
                    <div>
                      <label className="label" htmlFor="login-email">Email</label>
                      <input
                        id="login-email"
                        className="input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="username"
                        placeholder="you@cutm.ac.in"
                        disabled={loading}
                      />
                    </div>
                    <PasswordField
                      id="login-password"
                      label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={loading}
                    />
                    <button
                      className="btn-primary hero-cta-shine w-full !py-3 inline-flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="login-btn-spinner" aria-hidden />
                          Signing in…
                        </>
                      ) : (
                        'Sign in'
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={onChange} className="space-y-4">
                    <PasswordField
                      id="new-password"
                      label="New password (min 8 chars)"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      className="btn-primary hero-cta-shine w-full !py-3 inline-flex items-center justify-center gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="login-btn-spinner" aria-hidden />
                          Saving…
                        </>
                      ) : (
                        'Save & continue'
                      )}
                    </button>
                  </form>
                )}

                <p className="text-xs text-ink/45 mt-6 text-center md:text-left">
                  No public signup. Your HoD or admin sends the login.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
