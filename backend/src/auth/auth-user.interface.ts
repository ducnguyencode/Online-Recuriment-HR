export interface AuthUser {
    userId: number;
    email: string;
    roles: string[];
    departmentId: string | null;
    mustChangePassword?: boolean;
}