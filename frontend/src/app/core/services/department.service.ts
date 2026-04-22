import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Department } from '../models';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly base = `${environment.apiUrl}/department`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(this.base);
  }

  getById(id: string): Observable<ApiResponse<Department>> {
    return this.http.get<ApiResponse<Department>>(`${this.base}/${id}`);
  }

  create(
    name: string,
    description?: string,
  ): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(`${this.base}/create`, {
      name,
      description,
    });
  }

  update(
    id: string,
    data: Partial<Department>,
  ): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(`${this.base}/${id}`, data);
  }
}
