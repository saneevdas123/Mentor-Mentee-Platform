'use client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ROLE_LABELS } from '@/lib/rbac';

export default function Shell({ role, name, nav = [], children }) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex bg-cream">
      <aside className="w-64 bg-ink text-cream flex-col hidden md:flex no-print border-r-2 border-ink">
        <div className="px-5 py-5 border-b border-cream/15">
          <div className="font-bold leading-tight text-lg tracking-tight">CUTM Mentoring</div>
          <div className="text-xs text-accent mt-1 font-medium">{ROLE_LABELS[role] || role}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1.5">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-brand text-white border-2 border-cream/20 shadow-hard-sm'
                    : 'text-cream/75 hover:bg-cream/10 hover:text-cream'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-cream/15">
          <div className="text-xs text-cream/60 mb-2 px-1 truncate">{name}</div>
          <button
            onClick={logout}
            className="w-full text-left rounded-xl px-3 py-2 text-sm font-medium text-cream/75 hover:bg-cream/10 hover:text-cream"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-cream border-b-2 border-ink px-6 py-3 flex items-center justify-between no-print">
          <div className="md:hidden font-bold text-ink">CUTM Mentoring</div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-ink/50 font-medium">{ROLE_LABELS[role]}</span>
            <span className="font-semibold text-ink">{name}</span>
            <button onClick={logout} className="btn-ghost md:hidden !py-1.5 !px-3 text-xs">Sign out</button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
