import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Application, ApplicationStatus } from '../models';

export interface ApplicationFilters {
  vacancyId?: string;
  applicantId?: string;
  status?: string;
  page?: number;
  limit?: number;
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

  private isApiResponse(resp: unknown): resp is ApiResponse<unknown> {
    return !!resp && typeof resp === 'object' && 'statusCode' in resp && 'data' in resp;
  }

  private extractItems(raw: any): { items: any[]; total: number } {
    if (raw?.value && Array.isArray(raw.value)) {
      return { items: raw.value, total: Number(raw.Count ?? raw.value.length) };
    }
    if (Array.isArray(raw)) {
      return { items: raw, total: raw.length };
    }
    if (raw?.data && Array.isArray(raw.data)) {
      return { items: raw.data, total: raw.data.length };
    }
    return { items: [], total: 0 };
  }

  private mapApplicantStatus(status: any): Application['applicant'] extends never ? any : any {
    switch (status) {
      case 'OpenToWork':
      case 'In Process':
        return 'In Process';
      case 'Hired':
        return 'Hired';
      case 'Banned':
        return 'Banned';
      case 'Not in Process':
        return 'Not in Process';
      default:
        return (status ?? 'In Process') as any;
    }
  }

  private mapVacancyStatus(status: any): any {
    switch (status) {
      case 'Opened':
        return 'Open';
      case 'Closed':
        return 'Closed';
      case 'Suspended':
        return 'Suspended';
      default:
        return status ?? 'Open';
    }
  }

  private mapApplicationStatus(status: any): ApplicationStatus {
    switch (status) {
      case 'Applied':
        return 'Pending';
      case 'Screening':
        return 'Screening';
      case 'Interviewing':
        return 'Interview Scheduled';
      case 'Hired':
        return 'Selected';
      case 'Rejected':
        return 'Rejected';
      default:
        return (status ?? 'Pending') as ApplicationStatus;
    }
  }

  private mapApplication(a: any): Application {
    const aiMatchScore = a?.aiMatchScore ?? (a?.aiPrivew?.matchScore !== undefined ? Number(a.aiPrivew.matchScore) : undefined);

    return {
      ...(a as Application),
      status: this.mapApplicationStatus(a?.status),
      aiMatchScore,
      updatedAt: a?.updatedAt ?? a?.createdAt,
      applicant: a?.applicant
        ? {
            ...(a.applicant as any),
            status: this.mapApplicantStatus(a.applicant.status),
          }
        : undefined,
      vacancy: a?.vacancy
        ? {
            ...(a.vacancy as any),
            status: this.mapVacancyStatus(a.vacancy.status),
            filledCount: Number(a.vacancy?.filledCount ?? a.vacancy?.currentHiredCount ?? 0),
            ownedByEmployeeId: a.vacancy?.ownedByEmployeeId ?? '',
          }
        : undefined,
    } as Application;
  }

  getAll(filters: ApplicationFilters = {}): Observable<ApiResponse<PaginatedResponse<Application>>> {
    let params = new HttpParams();
    if (filters.vacancyId)   params = params.set('vacancyId', filters.vacancyId);
    if (filters.applicantId) params = params.set('applicantId', filters.applicantId);
    if (filters.status)      params = params.set('status', filters.status);
    if (filters.page)        params = params.set('page', filters.page.toString());
    if (filters.limit)       params = params.set('limit', filters.limit.toString());
    return this.http.get<any>(this.base, { params }).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<PaginatedResponse<Application>>;

        const { items, total } = this.extractItems(raw);
        const mapped = items.map(v => this.mapApplication(v));

        return {
          statusCode: 200,
          message: 'Success',
          data: {
            items: mapped,
            total,
            page: 1,
            limit: mapped.length,
            totalPages: 1,
          } as PaginatedResponse<Application>,
        } satisfies ApiResponse<PaginatedResponse<Application>>;
      }),
    );
  }

  getById(id: string): Observable<ApiResponse<Application>> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Application>;
        return { statusCode: 200, message: 'Success', data: this.mapApplication(raw) } as ApiResponse<Application>;
      }),
    );
  }

  create(dto: CreateApplicationDto): Observable<ApiResponse<Application>> {
    return this.http.post<any>(`${this.base}/create`, dto).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Application>;
        return { statusCode: 200, message: 'Success', data: this.mapApplication(raw) } as ApiResponse<Application>;
      }),
    );
  }

  /** Change application status — used by Kanban drag-drop */
  changeStatus(id: string, status: ApplicationStatus): Observable<ApiResponse<Application>> {
    let params = new HttpParams().set('id', id).set('status', status);
    // Backend expects: Applied | Screening | Interviewing | Hired | Rejected
    const backendStatus = (() => {
      switch (status) {
        case 'Pending':
          return 'Applied';
        case 'Interview Scheduled':
          return 'Interviewing';
        case 'Selected':
          return 'Hired';
        case 'Rejected':
          return 'Rejected';
        case 'Screening':
          return 'Screening';
        case 'Not Required':
          return 'Applied';
        default:
          return status;
      }
    })();

    params = new HttpParams().set('id', id).set('status', backendStatus);

    return this.http.post<any>(`${this.base}/change-status`, {}, { params }).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Application>;
        return { statusCode: 200, message: 'Success', data: this.mapApplication(raw) } as ApiResponse<Application>;
      }),
    );
  }

  calculateAiScore(id: string): Observable<ApiResponse<any>> {
    return this.http.post<any>(`${environment.apiUrl}/application/${id}/ai-score`, {}).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<any>;
        return { statusCode: 200, message: 'Success', data: raw } as ApiResponse<any>;
      }),
    );
  }
}
