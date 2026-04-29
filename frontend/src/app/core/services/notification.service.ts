import { computed, effect, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, InAppNotification } from '../models';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = `${environment.apiUrl}/notifications`;
  private socket: Socket;

  private _notifications = signal<InAppNotification[]>([]);

  public notifications = this._notifications.asReadonly();

  public unreadCount = computed(
    () => this._notifications().filter((n) => !n.isRead).length,
  );

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {
    const token = authService.getToken();
    this.socket = io(`${environment.apiUrl}/notifications`, {
      // withCredentials: true,
      auth: {
        token: token,
      },
    });

    effect(() => {
      const currentUser = this.authService.currentUser();
      if (currentUser?.id) {
        this.socket.on(
          `notification_${currentUser.id}`,
          (notif: InAppNotification) => {
            this._notifications.update((list) => [notif, ...list]);
          },
        );
      }
    });
  }

  getAll(page = 1, limit = 10, isRead?: boolean): Observable<ApiResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (isRead !== undefined) params = params.set('isRead', isRead.toString());
    // return this.http.get<ApiResponse<any>>(this.base, { params });
    return this.http.get<ApiResponse<any>>(this.base, { params }).pipe(
      tap((res) => {
        const items = (res.data as any)?.items ?? res.data ?? [];
        this._notifications.set(items);
      }),
    );
  }

  markRead(id: string): Observable<ApiResponse<InAppNotification>> {
    // return this.http.patch<ApiResponse<InAppNotification>>(`${this.base}/${id}/read`, {});
    return this.http
      .patch<ApiResponse<InAppNotification>>(`${this.base}/${id}/read`, {})
      .pipe(
        tap(() => {
          this._notifications.update((list) =>
            list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          );
        }),
      );
  }

  markAllRead(): Observable<ApiResponse<void>> {
    // return this.http.patch<ApiResponse<void>>(`${this.base}/read-all`, {});
    return this.http.patch<ApiResponse<void>>(`${this.base}/read-all`, {}).pipe(
      tap(() => {
        this._notifications.update((list) =>
          list.map((n) => ({ ...n, isRead: true })),
        );
      }),
    );
  }
}
