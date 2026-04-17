export interface AuthenticatedUser {
  userId: number;
  email: string;
  roles: string[];
  departmentId: string | null;
  mustChangePassword?: boolean;
}
