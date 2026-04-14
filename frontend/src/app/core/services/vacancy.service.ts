import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  Vacancy,
  VacancyStatus,
} from '../models';

export interface VacancyFilters {
  status?: string;
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateVacancyDto {
  title: string;
  description: string;
  numberOfOpenings: number;
  departmentId: string;
  closingDate: string | null;
}

export interface UpdateVacancyDto {
  title?: string;
  description?: string;
  numberOfOpenings?: number;
  closingDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class VacancyService {
  private readonly base = `${environment.apiUrl}/vacancy`;

  constructor(private http: HttpClient) {}

  getAll(
    filters: VacancyFilters = {},
  ): Observable<ApiResponse<PaginatedResponse<Vacancy>>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.search) params = params.set('title', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.departmentId)
      params = params.set('departmentId', filters.departmentId);
    return this.http.get<ApiResponse<PaginatedResponse<Vacancy>>>(this.base, {
      params,
    });
  }

  getById(id: string): Observable<ApiResponse<Vacancy>> {
    return this.http.get<ApiResponse<Vacancy>>(`${this.base}/${id}`);
  }

  create(dto: CreateVacancyDto): Observable<ApiResponse<Vacancy>> {
    return this.http.post<ApiResponse<Vacancy>>(`${this.base}/create`, dto);
  }

  update(id: string, dto: UpdateVacancyDto): Observable<ApiResponse<Vacancy>> {
    return this.http.put<ApiResponse<Vacancy>>(`${this.base}/${id}`, dto);
  }

  changeStatus(
    id: string,
    status: VacancyStatus,
  ): Observable<ApiResponse<Vacancy>> {
    return this.http.patch<ApiResponse<Vacancy>>(`${this.base}/${id}/status`, {
      status,
    });
  }
}
