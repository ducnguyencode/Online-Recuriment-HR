import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserAccount, LoginResponse } from '../models';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

interface LegacyLoginResponse {
  accessToken: string;
  user: Partial<UserAccount> & { sub?: string; accountId?: string };
}

type LoginApiResponse = LoginResponse | LegacyLoginResponse;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'hr_token';
  private readonly USER_KEY = 'hr_user';
  private readonly DEV_ROLE_KEY = 'hr_dev_role';
  private readonly STORAGE_VERSION_KEY = 'hr_auth_storage_version';
  private readonly STORAGE_VERSION = '2';
  private readonly MOCK_USERS: UserAccount[] = [
    { id: 'uuid-hr-01', email: 'an.nguyen@abc.com', fullName: 'Nguyễn Huỳnh Đức', role: 'HR', employeeId: 'emp-uuid-001', isActive: true },
    { id: 'uuid-hr-02', email: 'binh.tran@abc.com', fullName: 'Trần Thị Bình', role: 'HR', employeeId: 'emp-uuid-002', isActive: true },
    { id: 'uuid-iv-01', email: 'cuong.le@abc.com', fullName: 'Lê Văn Cường', role: 'Interviewer', employeeId: 'emp-uuid-003', isActive: true },
    { id: 'uuid-ap-01', email: 'hoa.nguyen@gmail.com', fullName: 'Nguyễn Thị Hoa', role: 'Applicant', applicantId: 'appl-4', isActive: true },
  ];

  currentUser = signal<UserAccount | null>(this.loadUser());
  isLoggedIn = computed(() => !!this.currentUser());
  isHR = computed(() => this.currentUser()?.role === 'HR');
  isInterviewer = computed(() => this.currentUser()?.role === 'Interviewer');
  isApplicant = computed(() => this.currentUser()?.role === 'Applicant');

  constructor(private http: HttpClient, private router: Router) {
    this.clearStaleAuthStorage();
    this.currentUser.set(this.loadUser());
  }

  login(email: string, password: string): Observable<LoginApiResponse> {
    return this.http.post<LoginApiResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  handleLoginSuccess(response: LoginApiResponse, returnUrl?: string) {
    const { token, user } = this.normalizeLoginResponse(response);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.router.navigateByUrl(returnUrl && returnUrl !== '/login' ? returnUrl : this.getDefaultRoute(user));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.DEV_ROLE_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
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
    return role === 'HR' || role === 'Interviewer' || role === 'Applicant' ? role : null;
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

  private loadUser(): UserAccount | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try {
        return this.normalizeUser(JSON.parse(stored) as Partial<UserAccount>);
      } catch {
        this.clearAuthStorage();
        return null;
      }
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

  private normalizeLoginResponse(response: LoginApiResponse): { token: string; user: UserAccount } {
    if ('data' in response) {
      return {
        token: response.data.token,
        user: this.normalizeUser(response.data.user),
      };
    }

    return {
      token: response.accessToken,
      user: this.normalizeUser(response.user),
    };
  }

  private normalizeUser(user: Partial<UserAccount> & { sub?: string; accountId?: string }): UserAccount {
    const id = user.id ?? user.accountId ?? user.sub ?? user.employeeId ?? user.applicantId ?? user.email ?? crypto.randomUUID();
    return {
      id,
      email: user.email ?? '',
      fullName: user.fullName ?? user.email ?? 'User',
      role: user.role ?? 'Applicant',
      employeeId: user.employeeId,
      applicantId: user.applicantId,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive ?? true,
    };
  }

  private getDefaultRoute(user: UserAccount): string {
    if (user.role === 'Applicant') {
      return '/hr-portal';
    }
    return '/hr-portal';
  }

  private clearStaleAuthStorage() {
    const currentVersion = localStorage.getItem(this.STORAGE_VERSION_KEY);
    if (currentVersion === this.STORAGE_VERSION) {
      return;
    }

    this.clearAuthStorage();
    localStorage.setItem(this.STORAGE_VERSION_KEY, this.STORAGE_VERSION);
  }

  private clearAuthStorage() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.DEV_ROLE_KEY);
  }
}
