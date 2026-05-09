import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface LoginHistoryItem {
  id: string;
  userId: number | null;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  status: 'SUCCESS' | 'FAILED';
  failureReason: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LoginHistoryService {
  private readonly base = `${environment.apiUrl}/admin/login-history`;

  constructor(private http: HttpClient) {}

  getLogs(filters: {
    limit?: number;
    email?: string;
    status?: 'SUCCESS' | 'FAILED';
  }): Observable<ApiResponse<LoginHistoryItem[]>> {
    let params = new HttpParams();
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.email) params = params.set('email', filters.email);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<ApiResponse<LoginHistoryItem[]>>(this.base, { params });
  }
}
