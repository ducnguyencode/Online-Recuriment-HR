import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MockDataService } from '../../core/services/mock-data.service';
import { environment } from '../../../environments/environment';

interface LoginAuditLog {
  id: string;
  userId: number;
  fullName: string;
  email: string;
  roles: string[];
  ipAddress: string | null;
  userAgent: string | null;
  isSuccess: boolean;
  failureReason: string | null;
  loggedAt: string;
}

@Component({
  selector: 'app-LAudit-LLog',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Audit Log</h1>
          <p class="page-subtitle">Review internal activity events for recruitment operations and status changes.</p>
        </div>
      </div>

      <div class="card" style="overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>IP</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            @for (item of logs(); track item.id) {
              <tr>
                <td class="mono-id">{{ item.loggedAt | date:'MM/dd/yyyy HH:mm' }}</td>
                <td>
                  <div class="entity-stack">
                    <span>{{ item.fullName }}</span>
                    <span class="mono-id">{{ item.email }}</span>
                  </div>
                </td>
                <td>{{ item.roles.join(', ') }}</td>
                <td>
                  <span class="badge" [ngClass]="item.isSuccess ? 'badge-success' : 'badge-danger'">
                    {{ item.isSuccess ? 'Success' : 'Failed' }}
                  </span>
                </td>
                <td class="mono-id">{{ item.ipAddress || '—' }}</td>
                <td>{{ item.failureReason || item.userAgent || '—' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="empty-state">
                  <div class="empty-icon">🧾</div>
                  <p>No audit logs available</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .entity-stack { display:flex; flex-direction:column; gap:2px; }
  `]
})
export class AuditLogComponent implements OnInit {
  logs = signal<LoginAuditLog[]>([]);

  constructor(
    private readonly http: HttpClient,
    private readonly mockData: MockDataService,
  ) {}

  ngOnInit() {
    this.http
      .get<{ statusCode: number; message: string; data: LoginAuditLog[] }>(
        `${environment.apiUrl}/users/auditlogs`,
      )
      .subscribe({
        next: (response) => {
          this.logs.set(response.data ?? []);
        },
        error: () => {
          // Fallback to local mock if API is unavailable.
          const fallback = this.mockData.getActivityLogs().map((item) => ({
            id: item.id,
            userId: Number(item.userId ?? 0),
            fullName: item.user?.fullName ?? 'Unknown',
            email: item.user?.email ?? 'unknown@example.com',
            roles: item.user?.role ? [item.user.role] : [],
            ipAddress: item.ipAddress ?? null,
            userAgent: null,
            isSuccess: true,
            failureReason: item.details ?? null,
            loggedAt: item.createdAt,
          }));
          this.logs.set(fallback);
        },
      });
  }
}
