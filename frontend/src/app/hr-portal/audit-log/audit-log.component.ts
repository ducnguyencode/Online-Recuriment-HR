import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuditLogItem, AuditLogService } from '../../core/services/audit-log.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-LAudit-LLog',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit {
  logs = signal<AuditLogItem[]>([]);
  accessMessage = signal<string>('Read-only audit view.');
  isLoading = signal(false);
  actionFilter = '';
  fromDate = '';
  toDate = '';

  constructor(
    private auditLogService: AuditLogService,
    private auth: AuthService,
  ) {}

  ngOnInit() {
    const role = this.auth.currentUser()?.role;
    if (role === UserRole.SUPER_ADMIN) {
      this.accessMessage.set(
        'Super Admin: can view logs from HR and Interviewer. This page is read-only.',
      );
    } else {
      this.accessMessage.set(
        'HR: can only view logs from Interviewer. This page is read-only.',
      );
    }

    this.loadLogs();
  }

  applyFilters() {
    this.loadLogs();
  }

  resetFilters() {
    this.actionFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadLogs();
  }

  private loadLogs() {
    const from = this.fromDate ? `${this.fromDate}T00:00:00.000Z` : undefined;
    const to = this.toDate ? `${this.toDate}T23:59:59.999Z` : undefined;
    const action = this.actionFilter.trim() || undefined;

    this.isLoading.set(true);
    this.auditLogService.getLogs({ limit: 200, action, from, to }).subscribe({
      next: (res) => this.logs.set(res.data ?? []),
      error: () => {
        this.logs.set([]);
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false),
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.actionFilter.trim() || this.fromDate || this.toDate);
  }

  getActorRoleClass(role: string): string {
    if (role === UserRole.HR) return 'badge-info';
    if (role === UserRole.INTERVIEWER) return 'badge-warning';
    if (role === UserRole.SUPER_ADMIN) return 'badge-danger';
    return 'badge-neutral';
  }

  getActionClass(action: string): string {
    if (action.includes('SUCCESS')) return 'badge-success';
    if (action.includes('FAILED')) return 'badge-danger';
    if (action.includes('REQUESTED')) return 'badge-info';
    if (action.includes('CHANGED')) return 'badge-warning';
    return 'badge-neutral';
  }

  formatDetails(item: AuditLogItem): string {
    if (!item.payload) return '—';
    const { ipAddress, userAgent, ...rest } = item.payload;
    const other = Object.keys(rest).length > 0 ? JSON.stringify(rest) : '';
    const ip = typeof ipAddress === 'string' ? `IP: ${ipAddress}` : '';
    const ua = typeof userAgent === 'string' ? `UA: ${userAgent}` : '';
    return [other, ip, ua].filter(Boolean).join(' | ') || '—';
  }
}
