import { UserRole } from 'src/common/enum';
import type { AuthUserView } from './auth.service';

/** Maps API auth view to the shape the Angular app expects after login/register. */
export function authViewToLegacyUser(view: AuthUserView) {
  let role: UserRole;
  if (view.role === 'Superadmin') role = UserRole.SUPER_ADMIN;
  else if (view.role === 'HR') role = UserRole.HR;
  else if (view.role === 'Interviewer') role = UserRole.INTERVIEWER;
  else role = UserRole.APPLICANT;

  return {
    id: String(view.id),
    email: view.email,
    fullName: view.fullName,
    role,
    applicantId: view.applicantId,
    employeeId: undefined as string | undefined,
    isActive: view.isActive,
  };
}

export function loginPayload(token: string, view: AuthUserView) {
  return {
    access_token: token,
    user: authViewToLegacyUser(view),
  };
}
