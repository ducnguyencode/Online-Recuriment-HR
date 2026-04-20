import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, UserAccount, UserRole } from '../models';

export interface CreateStaffAccountDto {
  email: string;
  fullName: string;
  role: Extract<UserRole, 'HR' | 'Interviewer'>;
  departmentId: string;
  position?: string;
  phone?: string;
}

export interface StaffAccountFilters {
  role?: UserRole | '';
  departmentId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly base = `${environment.apiUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  getAll(filters: StaffAccountFilters = {}): Observable<ApiResponse<PaginatedResponse<UserAccount>>> {
    let params = new HttpParams();
    if (filters.role) params = params.set('role', filters.role);
    if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.isActive !== undefined) params = params.set('isActive', String(filters.isActive));
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<ApiResponse<PaginatedResponse<UserAccount>>>(this.base, { params });
  }

  /**
   * Superadmin creates a HR/Interviewer account from email only.
   * Backend generates a temporary password, hashes it, sets MustChangePassword=TRUE,
   * and sends the credentials to the recipient email via the email queue.
   */
  createStaff(dto: CreateStaffAccountDto): Observable<ApiResponse<UserAccount>> {
    return this.http.post<ApiResponse<UserAccount>>(this.base, dto);
  }

  deactivate(userId: string): Observable<ApiResponse<UserAccount>> {
    return this.http.patch<ApiResponse<UserAccount>>(`${this.base}/${userId}/deactivate`, {});
  }

  activate(userId: string): Observable<ApiResponse<UserAccount>> {
    return this.http.patch<ApiResponse<UserAccount>>(`${this.base}/${userId}/activate`, {});
  }

  /** Force-send a fresh temporary password if user lost the welcome email. */
  resendTemporaryPassword(userId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${userId}/resend-credentials`, {});
  }
}
