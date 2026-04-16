import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Applicant, ApplicantStatus } from '../models';

export interface ApplicantFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateApplicantDto {
  fullName: string;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class ApplicantService {
  private readonly base = `${environment.apiUrl}/applicant`;

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

  private mapApplicantStatus(status: any): ApplicantStatus {
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
        return (status ?? 'In Process') as ApplicantStatus;
    }
  }

  private mapApplicant(a: any): Applicant {
    return {
      ...(a as Applicant),
      status: this.mapApplicantStatus(a?.status),
      updatedAt: a?.updatedAt ?? a?.createdAt,
      isActive: a?.isActive ?? true,
    } as Applicant;
  }

  getAll(filters: ApplicantFilters = {}): Observable<ApiResponse<PaginatedResponse<Applicant>>> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page)   params = params.set('page', filters.page.toString());
    if (filters.limit)  params = params.set('limit', filters.limit.toString());
    return this.http.get<any>(this.base, { params }).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<PaginatedResponse<Applicant>>;

        const { items, total } = this.extractItems(raw);
        const mapped = items.map(x => this.mapApplicant(x));

        return {
          statusCode: 200,
          message: 'Success',
          data: {
            items: mapped,
            total,
            page: 1,
            limit: mapped.length,
            totalPages: 1,
          } as PaginatedResponse<Applicant>,
        } satisfies ApiResponse<PaginatedResponse<Applicant>>;
      }),
    );
  }

  getById(id: string): Observable<ApiResponse<Applicant>> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Applicant>;
        return { statusCode: 200, message: 'Success', data: this.mapApplicant(raw) } as ApiResponse<Applicant>;
      }),
    );
  }

  create(dto: CreateApplicantDto): Observable<ApiResponse<Applicant>> {
    return this.http.post<any>(`${this.base}/create`, dto).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Applicant>;
        return { statusCode: 200, message: 'Success', data: this.mapApplicant(raw) } as ApiResponse<Applicant>;
      }),
    );
  }

  update(id: string, dto: Partial<CreateApplicantDto>): Observable<ApiResponse<Applicant>> {
    return this.http.put<any>(`${this.base}/${id}`, dto).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Applicant>;
        return { statusCode: 200, message: 'Success', data: this.mapApplicant(raw) } as ApiResponse<Applicant>;
      }),
    );
  }

  changeStatus(id: string, status: ApplicantStatus): Observable<ApiResponse<Applicant>> {
    return this.http.patch<any>(`${this.base}/${id}/status`, { status }).pipe(
      map((raw: any) => {
        if (this.isApiResponse(raw)) return raw as ApiResponse<Applicant>;
        return { statusCode: 200, message: 'Success', data: this.mapApplicant(raw) } as ApiResponse<Applicant>;
      }),
    );
  }
}
