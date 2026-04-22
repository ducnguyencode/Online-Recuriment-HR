import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Employee } from '../models';

export interface EmployeeFilters {
  departmentId?: string;
  role?: string;
  search?: string;
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
    return this.http.get<ApiResponse<Employee[]>>(this.base, { params });
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
}
