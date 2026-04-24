import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models';

export interface OverviewDto {
  vacanciesThisMonth: number;
  vacanciesLastMonth: number;
  applicationsProcessingThisMonth: number;
  applicationsProcessingLastMonth: number;
  interviewToday: number;
  applicationsThisMonth: number;
  applicantsHiredThisMonth: number;
  applicantsHiredLastMonth: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  activityOverview(): Observable<ApiResponse<OverviewDto>> {
    return this.http.get<ApiResponse<OverviewDto>>(
      `${this.base}/activity-overview`,
    );
  }
}
