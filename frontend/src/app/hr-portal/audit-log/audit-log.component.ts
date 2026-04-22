import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CrudAuditLog {
  id: string;
  createdAt: string;
  actorFullName: string;
  actorEmail: string;
  actorRole: string;
  httpMethod: string;
  path: string;
  resourceType: string | null;
  resourceId: number | null;
  detail: string | null;
}

interface AuditLogView extends CrudAuditLog {
  actorRoleLabel: string;
  actionLabel: string;
  resourceLabel: string;
  detailLabel: string;
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
          <p class="page-subtitle">
            Review CRUD activities from HR, Interviewer, Applicant actions.
          </p>
        </div>
      </div>

      <div class="card" style="overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            @for (item of logs(); track item.id) {
              <tr>
                <td class="mono-id">
                  {{ item.createdAt | date: 'MM/dd/yyyy HH:mm' }}
                </td>
                <td>
                  <div class="entity-stack">
                    <span>{{ item.actorFullName }}</span>
                    <span class="mono-id">{{ item.actorEmail }}</span>
                  </div>
                </td>
                <td>{{ item.actorRoleLabel }}</td>
                <td>
                  <span class="badge badge-info">{{ item.actionLabel }}</span>
                </td>
                <td class="mono-id">{{ item.resourceLabel }}</td>
                <td>{{ item.detailLabel }}</td>
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
  styles: [
    `
      .entity-stack {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
    `,
  ],
})
export class AuditLogComponent implements OnInit {
  logs = signal<AuditLogView[]>([]);

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.http
      .get<{
        statusCode: number;
        message: string;
        data: CrudAuditLog[];
      }>(`${environment.apiUrl}/audit-logs`)
      .subscribe({
        next: (response) => {
          const rows = (response.data ?? []).map((item) => this.toView(item));
          this.logs.set(rows);
        },
        error: () => this.logs.set([]),
      });
  }

  private toView(item: CrudAuditLog): AuditLogView {
    const actorRoleLabel = this.mapRole(item.actorRole);
    const actionLabel = this.mapAction(item.httpMethod, item.path);
    const resourceLabel = this.mapResource(item.resourceType, item.resourceId);
    const detailLabel =
      item.detail?.trim() ||
      `${actorRoleLabel} ${actionLabel.toLowerCase()} ${resourceLabel.toLowerCase()}.`;
    return {
      ...item,
      actorRoleLabel,
      actionLabel,
      resourceLabel,
      detailLabel,
    };
  }

  private mapRole(role: string): string {
    const r = role?.toUpperCase?.() ?? '';
    if (r === 'SUPERADMIN') return 'Superadmin';
    if (r === 'HR') return 'HR';
    if (r === 'INTERVIEWER') return 'Interviewer';
    if (r === 'APPLICANT') return 'Applicant';
    return role || 'Public';
  }

  private mapAction(method: string, path: string): string {
    if (path.endsWith('/status') && method === 'PATCH') return 'Changed status';
    if (path.endsWith('/change-status') && method === 'PATCH')
      return 'Changed application status';
    switch (method) {
      case 'POST':
        return 'Created';
      case 'PUT':
        return 'Updated';
      case 'PATCH':
        return 'Modified';
      case 'DELETE':
        return 'Deleted';
      default:
        return method;
    }
  }

  private mapResource(type: string | null, id: number | null): string {
    const t = (type ?? '').toLowerCase();
    let label = 'Resource';
    if (t === 'vacancy') label = 'Vacancy';
    else if (t === 'application') label = 'Application';
    else if (t === 'applicant') label = 'Applicant';
    else if (t === 'interviews' || t === 'interview') label = 'Interview';
    else if (t === 'department') label = 'Department';
    else if (t === 'employee') label = 'Employee';
    return id != null ? `${label} #${id}` : label;
  }
}
