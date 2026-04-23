import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  Employee,
  UpdateAccountResponse,
  UserAccount,
  UserRole,
} from '../models';

export interface EmployeeFilters {
  departmentId?: string;
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateEmployeeDto {
  email: string;
  fullName: string;
  role: Extract<UserRole, UserRole.HR | UserRole.INTERVIEWER>;
  departmentId: string;
  jobTitle?: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly base = `${environment.apiUrl}/employee`;

  constructor(private http: HttpClient) {}

  getAll(filters: EmployeeFilters = {}): Observable<ApiResponse<Employee[]>> {
    let params = new HttpParams();
    if (filters.departmentId)
      params = params.set('departmentId', filters.departmentId);
    if (filters.role) params = params.set('role', filters.role);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<ApiResponse<Employee[]>>(this.base, { params });
  }

  create(dto: CreateEmployeeDto): Observable<ApiResponse<UserAccount>> {
    return this.http.post<ApiResponse<UserAccount>>(`${this.base}/create`, dto);
  }

  getById(id: string): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.base}/${id}`);
  }

  /** Get interviewers from a specific department — required by spec */
  getInterviewersByDepartment(
    departmentId: string,
  ): Observable<ApiResponse<Employee[]>> {
    return this.getAll({ departmentId, role: 'Interviewer' });
  }

  updateAccount(dto: { email: string; fullName: string }) {
    return this.http.put<UpdateAccountResponse>(
      `${this.base}/update-account`,
      dto,
    );
  }
}
