'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    setErr(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setHome(data.home);
      if (data.user.mustChangePassword) { setChangeMode(true); }
      else router.push(data.home);
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
    <div className="min-h-screen grid md:grid-cols-2 bg-cream">
      <div className="hidden md:flex flex-col justify-between bg-ink text-cream p-10 border-r-2 border-ink">
        <div>
          <div className="text-sm font-semibold text-accent tracking-wide">Centurion University of Technology and Management</div>
          <h1 className="text-4xl font-bold mt-4 leading-[1.1] tracking-tight">Mentor–Mentee<br />Platform</h1>
          <p className="text-cream/70 mt-5 max-w-sm text-sm leading-relaxed">
            Structured mentoring with automated weekly meetings, monthly parent
            interactions, and audit-ready reporting for NAAC, NIRF and NBA.
          </p>
        </div>
        <ul className="text-sm text-cream/80 space-y-3">
          {[
            'Admin → Dean → HoD → Mentor → Student hierarchy',
            'Auto-scheduled Google Meet sessions & minutes',
            'One-click accreditation reports',
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-brand font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link href="/" className="md:hidden font-bold text-2xl mb-1 text-ink inline-block hover:text-brand">CUTM Mentoring</Link>
          <h2 className="text-2xl font-bold mb-1 text-ink">{changeMode ? 'Set a new password' : 'Sign in'}</h2>
          <p className="text-sm text-ink/60 mb-6">
            {changeMode ? 'This is your first login. Please choose a secure password.' : 'Use the credentials sent to your email.'}
          </p>

          {err && (
            <div className="mb-4 text-sm text-ink bg-accent-pink border-2 border-ink rounded-xl px-3 py-2 shadow-hard-sm">
              {err}
            </div>
          )}

          {!changeMode ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
            </form>
          ) : (
            <form onSubmit={onChange} className="space-y-4">
              <div>
                <label className="label">New password (min 8 chars)</label>
                <input className="input" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required minLength={8} />
              </div>
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Save & continue'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
