import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  UserAccount,
  LoginResponse,
  RegisterInternalUserPayload,
  RegisterInternalUserResponse,
} from '../models';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'hr_token';
  private readonly USER_KEY = 'hr_user';
  private readonly DEV_ROLE_KEY = 'hr_dev_role';
  private readonly MOCK_USERS: UserAccount[] = [
    { id: 'uuid-sa-01', email: 'admin@abc.com', fullName: 'Quản Lý Hệ Thống', role: 'Superadmin', employeeId: 'emp-uuid-admin', isActive: true },
    { id: 'uuid-hr-01', email: 'an.nguyen@abc.com', fullName: 'Nguyễn Huỳnh Đức', role: 'HR', employeeId: 'emp-uuid-001', isActive: true },
    { id: 'uuid-hr-02', email: 'binh.tran@abc.com', fullName: 'Trần Thị Bình', role: 'HR', employeeId: 'emp-uuid-002', isActive: true },
    { id: 'uuid-iv-01', email: 'cuong.le@abc.com', fullName: 'Lê Văn Cường', role: 'Interviewer', employeeId: 'emp-uuid-003', isActive: true },
    { id: 'uuid-ap-01', email: 'hoa.nguyen@gmail.com', fullName: 'Nguyễn Thị Hoa', role: 'Applicant', applicantId: 'appl-4', isActive: true },
  ];

  currentUser = signal<UserAccount | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.currentUser());
  isSuperadmin = computed(() => this.currentUser()?.role === 'Superadmin');
  isHR = computed(() => this.currentUser()?.role === 'HR');
  isInterviewer = computed(() => this.currentUser()?.role === 'Interviewer');
  isApplicant = computed(() => this.currentUser()?.role === 'Applicant');

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  applicantRegister(payload: { fullName: string; email: string; password: string }) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/register/applicant`, payload);
  }

  registerInternalUser(payload: RegisterInternalUserPayload) {
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    return this.http.post<RegisterInternalUserResponse>(
      `${environment.apiUrl}/auth/register/employee`,
      {
        ...payload,
        password: tempPassword,
      },
    );
  }

  fetchCurrentUser() {
    return this.http
      .get<{ statusCode: number; message: string; data: { userId: number; email: string; roles: string[]; departmentId: number | null; mustChangePassword?: boolean } }>(
        `${environment.apiUrl}/auth/me`,
      )
      .pipe(map((response) => response.data));
  }

  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.http.post<{ statusCode: number; message: string }>(
      `${environment.apiUrl}/auth/change-password`,
      payload,
    );
  }

  forgotPassword(email: string) {
    return this.http.post<{ statusCode: number; message: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email },
    );
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ statusCode: number; message: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      { token, newPassword },
    );
  }

  handleLoginSuccess(response: LoginResponse) {
    const mappedUser = this.mapApiUserToUserAccount(response.user);
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(mappedUser));
    this.currentUser.set(mappedUser);
    this.router.navigate([mappedUser.role === 'Applicant' ? '/applicant' : '/hr-portal']);
  }

  logout() {
    const role = this.currentUser()?.role;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.DEV_ROLE_KEY);
    this.currentUser.set(null);
    this.router.navigate([role === 'HR' || role === 'Superadmin' ? '/staff-login' : '/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  updateCurrentUser(patch: Partial<UserAccount>) {
    const current = this.currentUser();
    if (!current) return;
    const next = { ...current, ...patch };
    localStorage.setItem(this.USER_KEY, JSON.stringify(next));
    this.currentUser.set(next);
  }

  getDevRole(): UserAccount['role'] | null {
    const role = localStorage.getItem(this.DEV_ROLE_KEY);
    return role === 'HR' || role === 'Interviewer' || role === 'Applicant' || role === 'Superadmin' ? role : null;
  }

  getMockUsers(): UserAccount[] {
    return [...this.MOCK_USERS];
  }

  mockLoginAsRole(role: UserAccount['role']): boolean {
    const user = this.MOCK_USERS.find(item => item.role === role);
    if (!user) return false;
    const mockToken = 'mock-jwt-token-' + Date.now();
    localStorage.setItem(this.TOKEN_KEY, mockToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.DEV_ROLE_KEY, role);
    this.currentUser.set(user);
    return true;
  }

  mapApiUserToUserAccount(user: LoginResponse['user']): UserAccount {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: this.mapBackendRole(user.roles?.[0]),
      isActive: true,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
    };
  }

  private mapBackendRole(role?: string): UserAccount['role'] {
    switch (role) {
      case 'SUPERADMIN':
        return 'Superadmin';
      case 'INTERVIEWER':
        return 'Interviewer';
      case 'Interviewer':
        return 'Interviewer';
      case 'HR':
        return 'HR';
      case 'Applicant':
      case 'APPLICANT':
        return 'Applicant';
      default:
        return 'Applicant';
    }
  }

  private loadUser(): UserAccount | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  }

  // === MOCK LOGIN (khi backend chưa sẵn sàng) ===
  mockLogin(email: string, password: string): boolean {
    const user = this.MOCK_USERS.find(u => u.email === email);
    if (user && password === '123456') {
      const mockToken = 'mock-jwt-token-' + Date.now();
      localStorage.setItem(this.TOKEN_KEY, mockToken);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.DEV_ROLE_KEY, user.role);
      this.currentUser.set(user);
      return true;
    }
    return false;
  }
}
