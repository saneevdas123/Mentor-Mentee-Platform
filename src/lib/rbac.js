// Central definition of the role hierarchy and what each role may create.
// ADMIN > DEAN > HOD > MENTOR (faculty) > STUDENT (mentee)

export const ROLES = {
  ADMIN: 'ADMIN',
  DEAN: 'DEAN',
  HOD: 'HOD',
  MENTOR: 'MENTOR',
  STUDENT: 'STUDENT',
};

export const ROLE_LABELS = {
  ADMIN: 'Administrator',
  DEAN: 'Dean',
  HOD: 'Head of Department',
  MENTOR: 'Faculty Mentor',
  STUDENT: 'Student Mentee',
};

// Which role each role is allowed to create/provision.
export const CAN_CREATE = {
  ADMIN: ['DEAN'],
  DEAN: ['HOD'],
  HOD: ['MENTOR', 'STUDENT'],
  MENTOR: [],
  STUDENT: [],
};

// Landing dashboard route per role.
export const ROLE_HOME = {
  ADMIN: '/admin',
  DEAN: '/dean',
  HOD: '/hod',
  MENTOR: '/mentor',
  STUDENT: '/student',
};

const RANK = { ADMIN: 5, DEAN: 4, HOD: 3, MENTOR: 2, STUDENT: 1 };

export function atLeast(role, minRole) {
  return (RANK[role] || 0) >= (RANK[minRole] || 0);
}

export function canCreateRole(actorRole, targetRole) {
  return (CAN_CREATE[actorRole] || []).includes(targetRole);
}

// Route prefixes each role is allowed to access.
export const ROUTE_ACCESS = {
  '/admin': ['ADMIN'],
  '/dean': ['ADMIN', 'DEAN'],
  '/hod': ['ADMIN', 'DEAN', 'HOD'],
  '/mentor': ['ADMIN', 'DEAN', 'HOD', 'MENTOR'],
  '/student': ['ADMIN', 'DEAN', 'HOD', 'MENTOR', 'STUDENT'],
  '/reports': ['ADMIN', 'DEAN', 'HOD'],
};

export function canAccessPath(role, pathname) {
  const entry = Object.keys(ROUTE_ACCESS).find((p) => pathname.startsWith(p));
  if (!entry) return true; // non-protected path
  return ROUTE_ACCESS[entry].includes(role);
}
