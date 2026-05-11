import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  Application,
  ApplicationStatus,
} from '../models';

export interface ApplicationFilters {
  vacancyId?: string;
  applicantId?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'aiScore';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateApplicationDto {
  applicantId: string;
  vacancyId: string;
  cvId?: string;
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private readonly base = `${environment.apiUrl}/application`;

  constructor(private http: HttpClient) {}

  getAll(
    filters: ApplicationFilters = {},
  ): Observable<ApiResponse<PaginatedResponse<Application>>> {
    let params = new HttpParams();
    if (filters.vacancyId) params = params.set('vacancyId', filters.vacancyId);
    if (filters.applicantId)
      params = params.set('applicantId', filters.applicantId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    return this.http.get<ApiResponse<PaginatedResponse<Application>>>(
      this.base,
      { params },
    );
  }

  getById(id: string): Observable<ApiResponse<Application>> {
    return this.http.get<ApiResponse<Application>>(`${this.base}/${id}`);
  }

  create(dto: CreateApplicationDto): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(`${this.base}/create`, dto);
  }

  applicantCreate(
    dto: CreateApplicationDto,
  ): Observable<ApiResponse<Application>> {
    return this.http.post<ApiResponse<Application>>(
      `${this.base}/applicant-create`,
      dto,
    );
  }

  /** Change application status from the Applicant-Vacancy workflow. */
  changeStatus(
    id: string,
    status: ApplicationStatus,
  ): Observable<ApiResponse<Application>> {
    let params = new HttpParams().set('id', id).set('status', status);
    return this.http.patch<ApiResponse<Application>>(
      `${this.base}/change-status`,
      {},
      { params },
    );
  }

  calculateAiScore(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/application/${id}/ai-score`,
      {},
    );
  }

  getMyCvs(applicantId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/cv/${applicantId}`,
    );
  }
}
