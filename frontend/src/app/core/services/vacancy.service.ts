import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Vacancy, VacancyStatus } from '../models';

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
  closingDate: string;
}

export interface UpdateVacancyDto {
  title?: string;
  description?: string;
  numberOfOpenings?: number;
  closingDate?: string;
}

@Injectable({ providedIn: 'root' })
export class VacancyService {
  private readonly base = `${environment.apiUrl}/vacancy`;

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

  private mapVacancyStatus(status: any): VacancyStatus {
    switch (status) {
      case 'Opened':
        return 'Open';
      case 'Closed':
        return 'Closed';
      case 'Suspended':
        return 'Suspended';
      case 'Open':
        return 'Open';
      default:
        return (status ?? 'Open') as VacancyStatus;
    }
  }

  private mapVacancy(v: any): Vacancy {
    const filledCount = Number(v?.filledCount ?? v?.currentHiredCount ?? 0);
    return {
      ...(v as Vacancy),
      status: this.mapVacancyStatus(v?.status),
      filledCount,
      ownedByEmployeeId: v?.ownedByEmployeeId ?? '',
      departmentId: v?.departmentId ?? v?.department?.id,
      department: v?.department,
      updatedAt: v?.updatedAt ?? v?.createdAt,
    } as Vacancy;
  }

  getAll(filters: VacancyFilters = {}): Observable<ApiResponse<PaginatedResponse<Vacancy>>> {
    let params = new HttpParams();
    if (filters.status)       params = params.set('status', filters.status);
    if (filters.departmentId) params = params.set('departmentId', filters.departmentId);
    if (filters.search)       params = params.set('search', filters.search);
    if (filters.page)         params = params.set('page', filters.page.toString());
    if (filters.limit)        params = params.set('limit', filters.limit.toString());

    return this.http.get<any>(this.base, { params }).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<PaginatedResponse<Vacancy>>;

        const { items, total } = this.extractItems(raw);
        const mapped = items.map(v => this.mapVacancy(v));

        return {
          statusCode: 200,
          message: 'Success',
          data: {
            items: mapped,
            total,
            page: 1,
            limit: mapped.length,
            totalPages: 1,
          } as PaginatedResponse<Vacancy>,
        } satisfies ApiResponse<PaginatedResponse<Vacancy>>;
      }),
    );
  }

  getById(id: string): Observable<ApiResponse<Vacancy>> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Vacancy>;
        return { statusCode: 200, message: 'Success', data: this.mapVacancy(raw) } as ApiResponse<Vacancy>;
      }),
    );
  }

  create(dto: CreateVacancyDto): Observable<ApiResponse<Vacancy>> {
    return this.http.post<any>(`${this.base}/create`, dto).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Vacancy>;
        return { statusCode: 200, message: 'Success', data: this.mapVacancy(raw) } as ApiResponse<Vacancy>;
      }),
    );
  }

  update(id: string, dto: UpdateVacancyDto): Observable<ApiResponse<Vacancy>> {
    return this.http.put<any>(`${this.base}/${id}`, dto).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Vacancy>;
        return { statusCode: 200, message: 'Success', data: this.mapVacancy(raw) } as ApiResponse<Vacancy>;
      }),
    );
  }

  changeStatus(id: string, status: VacancyStatus): Observable<ApiResponse<Vacancy>> {
    return this.http.patch<any>(`${this.base}/${id}/status`, { status }).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Vacancy>;
        return { statusCode: 200, message: 'Success', data: this.mapVacancy(raw) } as ApiResponse<Vacancy>;
      }),
    );
  }
}
