import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, Interview } from '../models';

export interface ScheduleInterviewDto {
  applicationId: string;
  panel: { employeeId: string; role: string }[];
  // interviewDate: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  platform: 'Google Meet' | 'Zoom' | 'On-site';
}

export interface InterviewRescheduleDto {
  title: string;
  description?: string;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
}

export interface InterviewFilters {
  status?: string;
  date?: string;
  applicantId?: string;
  vacancyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AvailabilityFilters {
  employeeId: string;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly base = `${environment.apiUrl}/interviews`;

  constructor(private http: HttpClient) {}

  getAll(
    filters: InterviewFilters = {},
  ): Observable<ApiResponse<PaginatedResponse<Interview>>> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.date) params = params.set('date', filters.date);
    if (filters.applicantId)
      params = params.set('applicantId', filters.applicantId);
    if (filters.vacancyId) params = params.set('vacancyId', filters.vacancyId);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    return this.http.get<ApiResponse<PaginatedResponse<Interview>>>(this.base, {
      params,
    });
  }

  getById(id: string): Observable<ApiResponse<Interview>> {
    return this.http.get<ApiResponse<Interview>>(`${this.base}/${id}`);
  }

  schedule(dto: ScheduleInterviewDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.base}`, dto);
  }

  reschedule(
    id: string,
    dto: InterviewRescheduleDto,
  ): Observable<ApiResponse<Interview>> {
    return this.http.patch<ApiResponse<Interview>>(
      `${this.base}/${id}/reschedule`,
      dto,
    );
  }

  updateStatus(id: string, status: string): Observable<ApiResponse<Interview>> {
    return this.http.patch<ApiResponse<Interview>>(
      `${this.base}/${id}/status`,
      { status },
    );
  }

  submitResult(
    id: string,
    dto: { vote: 'Pass' | 'Fail'; feedback: string },
  ): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/${id}/result`, dto);
  }

  getAvailability(
    filters: AvailabilityFilters,
  ): Observable<ApiResponse<any[]>> {
    const params = new HttpParams()
      .set('employeeId', filters.employeeId)
      .set('startDate', filters.startDate)
      .set('endDate', filters.endDate);
    return this.http.get<ApiResponse<any[]>>(
      `${environment.apiUrl}/interviewer-availability`,
      { params },
    );
  }
}
