import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserAccount } from '../models';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

// Export Interface tại đây để LoginComponent có thể sử dụng (Fix lỗi TS2459)
export interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    token: string;
    user: UserAccount;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

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

  // Sửa hàm login nhận 1 object (Fix lỗi TS2554)
  login(credentials: any) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res.data && res.data.token) {
          this.handleLoginSuccess(res);
        }
      })
    );
  }

  handleLoginSuccess(response: LoginResponse) {
    const { token, user } = response.data;
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);

    // Điều hướng dựa trên role
    if (user.role === 'Applicant') {
      this.router.navigate(['/careers']);
    } else {
      this.router.navigate(['/hr-portal']);
    }
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

  private loadUser(): UserAccount | null {
    const stored = localStorage.getItem(this.USER_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  }

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
