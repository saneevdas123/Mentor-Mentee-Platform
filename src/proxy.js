import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { ROLE_HOME, ROUTE_ACCESS } from '@/lib/rbac';

const COOKIE = 'cutm_session';

async function readSession(req) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const key = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

function homeFor(role) {
  return ROLE_HOME[role] || '/';
}

function noStore(res) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.headers.set('Pragma', 'no-cache');
  return res;
}

/**
 * Next.js 16+ network proxy (replaces middleware).
 * Next 15 still runs this via src/middleware.js re-export.
 *
 * - Valid cookie → never show /login; send them to their role home
 * - No / expired cookie (7 days) → protected routes go to /login
 * - Wrong role on a dashboard → their own home, not the login screen
 */
export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  if (pathname === '/login' || pathname.startsWith('/login/')) {
    if (session?.role) {
      const url = req.nextUrl.clone();
      url.pathname = homeFor(session.role);
      url.search = '';
      return noStore(NextResponse.redirect(url));
    }
    return noStore(NextResponse.next());
  }

  const gate = Object.keys(ROUTE_ACCESS).find((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!gate) return NextResponse.next();

  if (!session?.role) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', pathname);
    return noStore(NextResponse.redirect(url));
  }

  if (!ROUTE_ACCESS[gate].includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = homeFor(session.role);
    url.search = '';
    return noStore(NextResponse.redirect(url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/dean/:path*',
    '/hod/:path*',
    '/mentor/:path*',
    '/student/:path*',
    '/reports/:path*',
  ],
};
