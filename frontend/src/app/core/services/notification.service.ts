import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, InAppNotification } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 10, isRead?: boolean): Observable<ApiResponse<any>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (isRead !== undefined) params = params.set('isRead', isRead.toString());
    return this.http.get<ApiResponse<any>>(this.base, { params });
  }

  markRead(id: string): Observable<ApiResponse<InAppNotification>> {
    return this.http.patch<ApiResponse<InAppNotification>>(`${this.base}/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/read-all`, {});
  }
}
