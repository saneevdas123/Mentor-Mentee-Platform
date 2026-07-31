'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ROLE_LABELS } from '@/lib/rbac';

export default function Shell({ role, name, nav = [], children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function isActive(href) {
    if (pathname === href) return true;
    if (href !== '/' && pathname.startsWith(`${href}/`)) return true;
    return false;
  }

  const NavLinks = ({ onNavigate }) => (
    <nav className="flex-1 p-3 space-y-1">
      {nav.map((n) => {
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={`block rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
              active
                ? 'bg-white/15 font-medium text-white shadow-sm'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              {active && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
              {n.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-brand text-white flex-col hidden md:flex no-print sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-semibold leading-tight tracking-tight">CUTM Mentoring</div>
          <div className="text-xs text-white/70 mt-1">{ROLE_LABELS[role] || role}</div>
        </div>
        <NavLinks />
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-white/70 mb-2 px-1 truncate" title={name}>{name}</div>
          <button
            type="button"
            onClick={logout}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden no-print">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-brand text-white flex flex-col shadow-2xl animate-drawer">
            <div className="px-5 py-5 border-b border-white/10 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold leading-tight">CUTM Mentoring</div>
                <div className="text-xs text-white/70 mt-1">{ROLE_LABELS[role] || role}</div>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-white/80 text-xl leading-none"
                aria-label="Close menu"
              >
                &times;
              </button>
            </div>
            <NavLinks onNavigate={() => setMenuOpen(false)} />
            <div className="p-3 border-t border-white/10">
              <div className="text-xs text-white/70 mb-2 px-1 truncate">{name}</div>
              <button type="button" onClick={logout} className="w-full text-left rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <header className="bg-white/90 backdrop-blur border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between no-print sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-brand hover:bg-brand-light transition"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="md:hidden font-semibold text-brand">CUTM Mentoring</div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-brand-light text-brand font-medium">
              {ROLE_LABELS[role]}
            </span>
            <span className="font-medium truncate max-w-[140px] sm:max-w-none">{name}</span>
            <button type="button" onClick={logout} className="btn-ghost py-1.5 px-3 md:hidden">Sign out</button>
          </div>
        </header>
        <div className="p-4 sm:p-6 animate-fade-up" key={pathname}>
          {children}
        </div>
      </main>
    </div>
  );
}
