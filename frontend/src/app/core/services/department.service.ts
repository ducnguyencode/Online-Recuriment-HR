import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Department } from '../models';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly base = `${environment.apiUrl}/department`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<Department[]>> {
    return this.http.get<any>(this.base).pipe(
      map((raw: any) => {
        if (raw?.statusCode !== undefined && raw?.data !== undefined) return raw as ApiResponse<Department[]>;
        return { statusCode: 200, message: 'Success', data: Array.isArray(raw) ? raw : [] } as ApiResponse<Department[]>;
      }),
    );
  }

  getById(id: string): Observable<ApiResponse<Department>> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map((raw: any) => {
        if (raw?.statusCode !== undefined && raw?.data !== undefined) return raw as ApiResponse<Department>;
        return { statusCode: 200, message: 'Success', data: raw } as ApiResponse<Department>;
      }),
    );
  }

  create(name: string, description?: string): Observable<ApiResponse<Department>> {
    return this.http.post<any>(`${this.base}/create`, { name, description }).pipe(
      map((raw: any) => {
        if (raw?.statusCode !== undefined && raw?.data !== undefined) return raw as ApiResponse<Department>;
        return { statusCode: 200, message: 'Success', data: raw } as ApiResponse<Department>;
      }),
    );
  }

  update(id: string, data: Partial<Department>): Observable<ApiResponse<Department>> {
    return this.http.put<any>(`${this.base}/${id}`, data).pipe(
      map((raw: any) => {
        if (raw?.statusCode !== undefined && raw?.data !== undefined) return raw as ApiResponse<Department>;
        return { statusCode: 200, message: 'Success', data: raw } as ApiResponse<Department>;
      }),
    );
  }
}
