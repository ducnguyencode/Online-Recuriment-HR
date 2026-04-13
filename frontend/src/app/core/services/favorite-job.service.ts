import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models';

export interface FavoriteJob {
  id: string;
  applicant: { id: string; fullName: string; email: string; phone: string };
  vacancy: { id: string; title: string };
  savedAt: string;
  hasApplied: boolean;
}

@Injectable({ providedIn: 'root' })
export class FavoriteJobService {
  private readonly base = `${environment.apiUrl}/favorite-jobs`;

  constructor(private http: HttpClient) {}

  /** HR: view all applicants who saved a vacancy but have not applied */
  getAll(vacancyId?: string, page = 1, limit = 10): Observable<ApiResponse<PaginatedResponse<FavoriteJob>>> {
    let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
    if (vacancyId) params = params.set('vacancyId', vacancyId);
    return this.http.get<ApiResponse<PaginatedResponse<FavoriteJob>>>(this.base, { params });
  }

  /** Applicant: save a vacancy as favorite */
  save(vacancyId: string): Observable<ApiResponse<FavoriteJob>> {
    return this.http.post<ApiResponse<FavoriteJob>>(this.base, { vacancyId });
  }

  /** Applicant: remove a saved vacancy */
  remove(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }
}
