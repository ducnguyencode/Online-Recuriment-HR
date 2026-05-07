import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PaginatedResponse,
  Applicant,
  ApplicantStatus,
  UpdateAccountResponse,
  CV,
} from '../models';

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

  getAll(
    filters: ApplicantFilters = {},
  ): Observable<ApiResponse<PaginatedResponse<Applicant>>> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Applicant>>>(this.base, {
      params,
    });
  }

  getById(id: string): Observable<ApiResponse<Applicant>> {
    return this.http.get<ApiResponse<Applicant>>(`${this.base}/${id}`);
  }

  create(dto: CreateApplicantDto): Observable<ApiResponse<Applicant>> {
    return this.http.post<ApiResponse<Applicant>>(`${this.base}/create`, dto);
  }

  uploadCv(formData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/cv/create`,
      formData,
    );
  }

  update(
    id: string,
    dto: Partial<CreateApplicantDto>,
  ): Observable<ApiResponse<Applicant>> {
    return this.http.put<ApiResponse<Applicant>>(`${this.base}/${id}`, dto);
  }

  updateAccount(dto: { email: string; fullName: string; phone: string }) {
    return this.http.put<UpdateAccountResponse>(
      `${this.base}/update-account`,
      dto,
    );
  }

  changeStatus(
    id: string,
    status: ApplicantStatus,
  ): Observable<ApiResponse<Applicant>> {
    return this.http.patch<ApiResponse<Applicant>>(
      `${this.base}/${id}/status`,
      { status },
    );
  }

  changePassword(dto: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return this.http.put<ApiResponse<any>>(`${this.base}/change-password`, dto);
  }

  findAllCvByApplicantId(id: string): Observable<ApiResponse<CV[]>> {
    return this.http.get<ApiResponse<CV[]>>(`${environment.apiUrl}/cv/${id}`);
  }

  deleteCv(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${environment.apiUrl}/cv/${id}`,
    );
  }
}
