import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface AuditLogItem {
  id: string;
  actorId: number | null;
  actorRoleSnapshot: string;
  action: string;
  targetId: number | null;
  targetRoleSnapshot: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly base = `${environment.apiUrl}/admin/audit-logs`;

  constructor(private http: HttpClient) {}

  getLogs(filters: {
    limit?: number;
    action?: string;
    from?: string;
    to?: string;
  }): Observable<ApiResponse<AuditLogItem[]>> {
    let params = new HttpParams();
    if (filters.limit) params = params.set('limit', String(filters.limit));
    if (filters.action) params = params.set('action', filters.action);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<ApiResponse<AuditLogItem[]>>(`${this.base}`, { params });
  }
}
