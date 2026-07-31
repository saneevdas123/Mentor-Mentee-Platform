'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [changeMode, setChangeMode] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [home, setHome] = useState('/');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (search.get('denied') === '1') {
      setErr('You do not have access to that page. Sign in with the correct role.');
    }
  }, [search]);

  async function onLogin(e) {
    e.preventDefault();
    setErr(''); setInfo(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const next = search.get('next');
      const dest = next && next.startsWith('/') ? next : data.home;
      setHome(dest);
      if (data.user.mustChangePassword) {
        setChangeMode(true);
        setInfo('First login — please choose a new secure password.');
      } else {
        router.push(dest);
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  async function onChange(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: password, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(home);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-brand text-white p-10 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(200,162,74,0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 45%)',
          }}
        />
        <div className="relative animate-fade-up">
          <div className="text-sm text-white/70 tracking-wide">Centurion University of Technology and Management</div>
          <h1 className="text-3xl font-bold mt-3 leading-tight tracking-tight">Mentor–Mentee<br />Platform</h1>
          <p className="text-white/80 mt-4 max-w-sm text-sm leading-relaxed">
            A structured mentoring system with automated weekly meetings, monthly parent
            interactions, and audit-ready reporting for NAAC, NIRF and NBA.
          </p>
        </div>
        <ul className="relative text-sm text-white/85 space-y-3 stagger">
          {[
            'Admin → Dean → HoD → Mentor → Student hierarchy',
            'Auto-scheduled Google Meet sessions & minutes',
            'One-click accreditation reports',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="md:hidden text-brand font-bold text-xl mb-2">CUTM Mentoring</div>
          <h2 className="text-xl font-semibold mb-1 tracking-tight">
            {changeMode ? 'Set a new password' : 'Welcome back'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {changeMode
              ? 'This is your first login. Choose a secure password to continue.'
              : 'Sign in with the credentials sent to your email.'}
          </p>

          {err && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 animate-scale-in" role="alert">
              {err}
            </div>
          )}
          {info && !err && (
            <div className="mb-4 text-sm text-brand bg-brand-light border border-brand/20 rounded-lg px-3 py-2.5 animate-scale-in">
              {info}
            </div>
          )}

          {!changeMode ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="you@cutm.ac.in"
                />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    className="input pr-16"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-brand px-2 py-1 rounded transition"
                    onClick={() => setShowPass((v) => !v)}
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="btn-primary w-full" disabled={loading}>
                {loading && <Spinner />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={onChange} className="space-y-4 animate-fade-up">
              <div>
                <label className="label" htmlFor="newPass">New password (min 8 chars)</label>
                <input
                  id="newPass"
                  className="input"
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoFocus
                />
              </div>
              <button className="btn-primary w-full" disabled={loading}>
                {loading && <Spinner />}
                {loading ? 'Saving…' : 'Save & continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500 text-sm"><Spinner className="mr-2" /> Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
