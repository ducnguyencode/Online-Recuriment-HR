import { UserRole } from 'src/common/enum';
import { USER_ROLES } from './role.constants';

export function userRoleEnumToAuthRoles(role: UserRole): string[] {
  if (role === UserRole.SUPER_ADMIN) return [USER_ROLES.SUPERADMIN];
  if (role === UserRole.HR) return [USER_ROLES.HR];
  if (role === UserRole.INTERVIEWER) return [USER_ROLES.INTERVIEWER];
  return [USER_ROLES.APPLICANT];
}

export function authRolesToUserRoleEnum(roles: string[]): UserRole {
  const upper = roles.map((r) => String(r).toUpperCase());
  if (upper.includes(USER_ROLES.SUPERADMIN)) return UserRole.SUPER_ADMIN;
  if (upper.includes(USER_ROLES.HR)) return UserRole.HR;
  if (upper.includes(USER_ROLES.INTERVIEWER)) return UserRole.INTERVIEWER;
  return UserRole.APPLICANT;
}
