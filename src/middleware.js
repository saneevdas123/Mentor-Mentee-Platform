import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED = ['/admin', '/dean', '/hod', '/mentor', '/student', '/reports'];

const ROUTE_ACCESS = {
  '/admin': ['ADMIN'],
  '/dean': ['ADMIN', 'DEAN'],
  '/hod': ['ADMIN', 'DEAN', 'HOD'],
  '/mentor': ['ADMIN', 'DEAN', 'HOD', 'MENTOR'],
  '/student': ['ADMIN', 'DEAN', 'HOD', 'MENTOR', 'STUDENT'],
  '/reports': ['ADMIN', 'DEAN', 'HOD'],
};

async function readSession(req) {
  const token = req.cookies.get('cutm_session')?.value;
  if (!token) return null;
  try {
    const key = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  const session = await readSession(req);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const entry = Object.keys(ROUTE_ACCESS).find((p) => pathname.startsWith(p));
  if (entry && !ROUTE_ACCESS[entry].includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('denied', '1');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dean/:path*', '/hod/:path*', '/mentor/:path*', '/student/:path*', '/reports/:path*'],
};
