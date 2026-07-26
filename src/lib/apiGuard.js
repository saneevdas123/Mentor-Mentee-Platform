import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { atLeast } from '@/lib/rbac';

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Require any authenticated user. Returns the session or a NextResponse error.
export async function requireAuth() {
  const session = await getSession();
  if (!session) return { error: error('Unauthorized', 401) };
  return { session };
}

// Require a minimum role level.
export async function requireRole(minRole) {
  const session = await getSession();
  if (!session) return { error: error('Unauthorized', 401) };
  if (!atLeast(session.role, minRole)) return { error: error('Forbidden', 403) };
  return { session };
}

// Require one of an explicit set of roles.
export async function requireOneOf(roles) {
  const session = await getSession();
  if (!session) return { error: error('Unauthorized', 401) };
  if (!roles.includes(session.role)) return { error: error('Forbidden', 403) };
  return { session };
}
