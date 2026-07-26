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
    <div className="min-h-screen flex">
      <aside className="w-64 bg-brand text-white flex-col hidden md:flex no-print">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="font-semibold leading-tight">CUTM Mentoring</div>
          <div className="text-xs text-white/70 mt-1">{ROLE_LABELS[role] || role}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const active = pathname === n.href;
            return (
              <Link key={n.href} href={n.href}
                className={`block rounded-lg px-3 py-2 text-sm ${active ? 'bg-white/15 font-medium' : 'text-white/80 hover:bg-white/10'}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-white/70 mb-2 px-1 truncate">{name}</div>
          <button onClick={logout} className="w-full text-left rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between no-print">
          <div className="md:hidden font-semibold text-brand">CUTM Mentoring</div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-gray-500">{ROLE_LABELS[role]}</span>
            <span className="font-medium">{name}</span>
            <button onClick={logout} className="btn-ghost md:hidden">Sign out</button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
