import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { ActivityLog } from '../../core/models';

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
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            @for (item of logs(); track item.id) {
              <tr>
                <td class="mono-id">{{ item.createdAt | date:'MM/dd/yyyy HH:mm' }}</td>
                <td><span class="badge badge-neutral">{{ item.action }}</span></td>
                <td>
                  <div class="entity-stack">
                    <span>{{ item.entityType }}</span>
                    <span class="mono-id">{{ item.entityId }}</span>
                  </div>
                </td>
                <td>{{ item.details || '—' }}</td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="empty-state">
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
  logs = signal<ActivityLog[]>([]);

  constructor(private mockData: MockDataService) {}

  ngOnInit() {
    this.logs.set(this.mockData.getActivityLogs());
  }
}
