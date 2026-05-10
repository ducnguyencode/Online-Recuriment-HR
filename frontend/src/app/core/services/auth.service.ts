import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  UserAccount,
  LoginResponse,
  UserRole,
  UserRoleLogin,
  ApiResponse,
  UpdateAccountResponse,
} from '../models';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'hr_token';
  private readonly USER_KEY = 'hr_user';
  private readonly DEV_ROLE_KEY = 'hr_dev_role';
  private readonly MOCK_USERS: UserAccount[] = [
    {
      id: 'uuid-sa-01',
      email: 'admin@abc.com',
      fullName: 'System Administrator',
      role: UserRole.SUPER_ADMIN,
      employeeId: 'emp-uuid-admin',
      isActive: true,
    },
    {
      id: 'uuid-hr-01',
      email: 'an.nguyen@abc.com',
      fullName: 'Nguyễn Huỳnh Đức',
      role: UserRole.HR,
      employeeId: 'emp-uuid-001',
      isActive: true,
    },
    {
      id: 'uuid-hr-02',
      email: 'binh.tran@abc.com',
      fullName: 'Trần Thị Bình',
      role: UserRole.HR,
      employeeId: 'emp-uuid-002',
      isActive: true,
    },
    {
      id: 'uuid-iv-01',
      email: 'cuong.le@abc.com',
      fullName: 'Lê Văn Cường',
      role: UserRole.INTERVIEWER,
      employeeId: 'emp-uuid-003',
      isActive: true,
    },
    {
      id: 'uuid-ap-01',
      email: 'hoa.nguyen@gmail.com',
      fullName: 'Nguyễn Thị Hoa',
      role: UserRole.APPLICANT,
      applicantId: 'appl-4',
      isActive: true,
    },
  ];

  currentUser = signal<UserAccount | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.currentUser());
  isSuperadmin = computed(
    () => this.currentUser()?.role === UserRole.SUPER_ADMIN,
  );
  isHR = computed(() => this.currentUser()?.role === UserRole.HR);
  isInterviewer = computed(
    () => this.currentUser()?.role === UserRole.INTERVIEWER,
  );
  isApplicant = computed(() => this.currentUser()?.role === UserRole.APPLICANT);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(loginData: { email: string; password: string }) {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/login`,
      loginData,
    );
  }

  register(registerData: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return this.http.post<ApiResponse<UserAccount>>(
      `${environment.apiUrl}/auth/register`,
      registerData,
    );
  }

  verifyEmail(token: string) {
    return this.http.get<ApiResponse<UserAccount>>(
      `${environment.apiUrl}/auth/verify-email?token=${encodeURIComponent(token)}`,
    );
  }

  forgotPassword(email: string, scope?: string) {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email, scope },
    );
  }

  resendVerify(email: string) {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/resend-verify`,
      { email },
    );
  }

  verifyResetToken(token: string) {
    return this.http.get<ApiResponse<{ valid: boolean; message: string }>>(
      `${environment.apiUrl}/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
    );
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/reset-password`,
      { token, newPassword },
    );
  }

  handleLoginSuccess(response: LoginResponse, userRoleLogin: UserRoleLogin) {
    const { access_token, user } = response.data;
    const normalizedUser = this.normalizeUser(user);
    localStorage.setItem(this.TOKEN_KEY, access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    this.currentUser.set(normalizedUser);

    if (userRoleLogin == UserRoleLogin.HR) {
      this.router.navigate(['/hr-portal']);
      return;
    }
    this.router.navigate(['/']);
  }

  setInitialPassword(dto: { token: string; newPassword: string }) {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${environment.apiUrl}/auth/set-initial-password`,
      {
        token: dto.token,
        password: dto.newPassword,
      },
    );
  }

  handleUpdateAccountSuccess(response: UpdateAccountResponse) {
    const { access_token, user } = response.data;
    const normalizedUser = this.normalizeUser(user);
    localStorage.setItem(this.TOKEN_KEY, access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
    this.currentUser.set(normalizedUser);
  }

  logout(redirectTo: string = '/login') {
    const hasToken = !!this.getToken();
    if (hasToken) {
      this.http.post<ApiResponse<{ message: string }>>(
        `${environment.apiUrl}/auth/logout`,
        {},
      ).subscribe({
        error: () => this.finalizeLogout(redirectTo),
        complete: () => this.finalizeLogout(redirectTo),
      });
      return;
    }
    this.finalizeLogout(redirectTo);
  }

  private finalizeLogout(redirectTo: string) {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.DEV_ROLE_KEY);
    this.currentUser.set(null);
    this.router.navigateByUrl(redirectTo);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  updateCurrentUser(patch: Partial<UserAccount>) {
    const current = this.currentUser();
    if (!current) return;
    const next = this.normalizeUser({ ...current, ...patch });
    localStorage.setItem(this.USER_KEY, JSON.stringify(next));
    this.currentUser.set(next);
  }

  getDevRole(): UserAccount['role'] | null {
    const role = localStorage.getItem(this.DEV_ROLE_KEY);
    return (role as UserRole) ?? null;
  }

  getMockUsers(): UserAccount[] {
    return [...this.MOCK_USERS];
  }

  mockLoginAsRole(role: UserAccount['role']): boolean {
    const user = this.MOCK_USERS.find((item) => item.role === role);
    if (!user) return false;
    const mockToken = 'mock-jwt-token-' + Date.now();
    localStorage.setItem(this.TOKEN_KEY, mockToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.DEV_ROLE_KEY, role);
    this.currentUser.set(user);
    return true;
  }

  private loadUser(): UserAccount | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try {
        return this.normalizeUser(JSON.parse(stored));
      } catch {
        return null;
      }
    }
    return null;
  }

  // === MOCK LOGIN (khi backend chưa sẵn sàng) ===
  mockLogin(email: string, password: string): boolean {
    const user = this.MOCK_USERS.find((u) => u.email === email);
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

  refreshMe() {
    const token = this.getToken();
    if (!token && !this.currentUser()) {
      return;
    }
    return this.http
      .get<ApiResponse<UserAccount>>(`${environment.apiUrl}/auth/me`)
      .pipe(
        tap((res) => {
          const normalizedUser = this.normalizeUser(res.data);
          localStorage.setItem(this.USER_KEY, JSON.stringify(normalizedUser));
          this.currentUser.set(normalizedUser);
        }),
      );
  }

  private normalizeUser(user: UserAccount): UserAccount {
    const raw = user as any;
    const employeeId =
      raw.employeeId ?? raw.employee?.id ?? raw.employee?.employeeId;
    const applicantId =
      raw.applicantId ?? raw.applicant?.id ?? raw.applicant?.applicantId;

    return {
      ...user,
      employeeId: employeeId != null ? String(employeeId) : undefined,
      employeeCode: raw.employeeCode ?? raw.employee?.code,
      applicantId: applicantId != null ? String(applicantId) : undefined,
      applicantCode: raw.applicantCode ?? raw.applicant?.code,
    };
  }
}
