import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, UserAccount, UserRole } from '../models';

export interface CreateStaffAccountDto {
  email: string;
  fullName: string;
  role: Extract<UserRole, 'HR' | 'Interviewer'>;
  departmentId: number;
  position?: string;
  phone?: string;
}

export interface UpdateStaffAccountDto {
  fullName: string;
  role: Extract<UserRole, 'HR' | 'Interviewer'>;
  departmentId: number;
  position?: string;
  phone?: string;
}

export interface StaffAccountFilters {
  role?: UserRole | '';
  departmentId?: number;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateStaffRoleDto {
  role: Extract<UserRole, 'HR' | 'Interviewer'>;
  reason: string;
}

export interface RoleChangePreconditions {
  blockingVacancies: number[];
  blockingInterviews: string[];
  canProceed: boolean;
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

  createStaff(dto: CreateStaffAccountDto): Observable<ApiResponse<UserAccount>> {
    return this.http.post<ApiResponse<UserAccount>>(this.base, dto);
  }

  updateStaff(
    userId: string,
    dto: UpdateStaffAccountDto,
  ): Observable<ApiResponse<UserAccount>> {
    return this.http.patch<ApiResponse<UserAccount>>(`${this.base}/${userId}`, dto);
  }

  deactivate(userId: string): Observable<ApiResponse<UserAccount>> {
    return this.http.patch<ApiResponse<UserAccount>>(`${this.base}/${userId}/deactivate`, {});
  }

  activate(userId: string): Observable<ApiResponse<UserAccount>> {
    return this.http.patch<ApiResponse<UserAccount>>(`${this.base}/${userId}/activate`, {});
  }

  /** Re-send invite or password setup/reset activation email. */
  resendTemporaryPassword(userId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${userId}/resend-invite`, {});
  }

  getRoleChangePreconditions(
    userId: string,
    role: Extract<UserRole, 'HR' | 'Interviewer'>,
  ): Observable<ApiResponse<RoleChangePreconditions>> {
    const params = new HttpParams().set('newRole', role);
    return this.http.get<ApiResponse<RoleChangePreconditions>>(
      `${this.base}/${userId}/role-change-preconditions`,
      { params },
    );
  }

  updateRole(
    userId: string,
    dto: UpdateStaffRoleDto,
  ): Observable<ApiResponse<UserAccount>> {
    return this.http.patch<ApiResponse<UserAccount>>(
      `${this.base}/${userId}/role`,
      dto,
    );
  }
}
