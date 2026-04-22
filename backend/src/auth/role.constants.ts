/** JWT / DB role strings — do not rename without updating guards & seed data */
export const USER_ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  HR: 'HR',
  INTERVIEWER: 'INTERVIEWER',
  APPLICANT: 'APPLICANT',
} as const;

export type UserRoleValue = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const STAFF_ROLES: string[] = [
  USER_ROLES.SUPERADMIN,
  USER_ROLES.HR,
  USER_ROLES.INTERVIEWER,
];

export function isStaffRoles(roles: string[]): boolean {
  return roles.some((r) => STAFF_ROLES.includes(r));
}

export function isApplicantRole(roles: string[]): boolean {
  return roles.includes(USER_ROLES.APPLICANT);
}

/**
 * Maps mixed-case / legacy DB values (e.g. "Interviewer") to canonical USER_ROLES.
 */
/** Highest-privilege role for audit / display (after canonicalize). */
export function primaryRole(roles: string[]): string {
  const r = canonicalizeRoles(roles);
  if (r.includes(USER_ROLES.SUPERADMIN)) return USER_ROLES.SUPERADMIN;
  if (r.includes(USER_ROLES.HR)) return USER_ROLES.HR;
  if (r.includes(USER_ROLES.INTERVIEWER)) return USER_ROLES.INTERVIEWER;
  if (r.includes(USER_ROLES.APPLICANT)) return USER_ROLES.APPLICANT;
  return 'PUBLIC';
}

export function canonicalizeRoles(
  roles: string[] | string | undefined | null,
): string[] {
  const raw = roles ?? [];
  const list = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const out: string[] = [];
  for (const raw of list) {
    const key = String(raw).trim().toUpperCase();
    if (key === 'SUPERADMIN' || key === 'SUPER_ADMIN') {
      out.push(USER_ROLES.SUPERADMIN);
    } else if (key === 'HR') {
      out.push(USER_ROLES.HR);
    } else if (key === 'INTERVIEWER' || key === 'INTERVIEW') {
      out.push(USER_ROLES.INTERVIEWER);
    } else if (key === 'APPLICANT') {
      out.push(USER_ROLES.APPLICANT);
    } else if (key) {
      out.push(key);
    }
  }
  return out;
}
