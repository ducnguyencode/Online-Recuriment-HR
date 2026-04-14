import { UserRole } from 'src/enum/user-role.enum';

export interface AuthUser {
  accountId: string;
  email: string;
  role: UserRole;
  employeeId: string | null;
  applicantId: string | null;
}
