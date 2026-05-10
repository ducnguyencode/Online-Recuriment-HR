import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

    /** HR/Superadmin: view all applicants who saved a vacancy */
    getAll(vacancyId?: string, page = 1, limit = 10): Observable<ApiResponse<PaginatedResponse<FavoriteJob>>> {
        let params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());
        if (vacancyId) params = params.set('vacancyId', vacancyId);
        return this.http.get<ApiResponse<PaginatedResponse<FavoriteJob>>>(`${this.base}/admin`, { params });
    }

    /** Applicant: toggle save/unsave a vacancy */
    toggle(vacancyId: string): Observable<ApiResponse<{ saved: boolean }>> {
        return this.http.post<ApiResponse<{ saved: boolean }>>(
            `${this.base}/toggle/${vacancyId}`,
            {},
        );
    }

    /** Applicant: get all saved vacancy IDs */
    getSavedIds(): Observable<string[]> {
        return this.http
            .get<ApiResponse<any[]>>(this.base)
            .pipe(map((res) => (res.data ?? []).map((j: any) => String(j.vacancyId ?? j.vacancy?.id))));
    }

    /** Applicant: save a vacancy as favorite */
    save(vacancyId: string): Observable<ApiResponse<FavoriteJob>> {
        return this.http.post<ApiResponse<FavoriteJob>>(this.base, { vacancyId });
    }

    /** Applicant: remove a saved vacancy */
    remove(id: string): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
    }

    /** Applicant: get saved vacancy objects (for dashboard) */
    getSavedList(): Observable<any[]> {
        return this.http
            .get<ApiResponse<any[]>>(this.base)
            .pipe(
                map((res) =>
                    (res.data ?? []).map((s: any) => ({
                        ...s.vacancy,
                        id: s.vacancyId ?? s.vacancy?.id,
                        vacancyId: s.vacancyId ?? s.vacancy?.id,
                        closingDate: s.vacancy?.closingDate ?? null,
                        department: s.vacancy?.department ?? null,
                        title: s.vacancy?.title ?? '',
                    })),
                ),
            );
    }
}
