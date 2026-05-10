import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuditLogItem, AuditLogService } from '../../core/services/audit-log.service';
import {
  LoginHistoryItem,
  LoginHistoryService,
} from '../../core/services/login-history.service';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-LAudit-LLog',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit, OnDestroy {
  private static readonly CRUD_PATTERN =
    /(CREATE|UPDATE|DELETE|PATCH|ACTIVATE|DEACTIVATE|ROLE_CHANGED)/i;
  private static readonly AUTH_LOGIN_ACTION = 'AUTH_LOGIN_SUCCESS';
  private static readonly AUTH_LOGOUT_ACTION = 'AUTH_LOGOUT';
  private static readonly AUTH_ACTION_PATTERN = /^AUTH_/i;
  logs = signal<AuditLogItem[]>([]);
  accessMessage = signal<string>('Read-only audit view.');
  isLoading = signal(false);
  selectedSession = signal<UserSessionDetail | null>(null);
  isSessionLoading = signal(false);
  isSuperAdmin = false;
  showMyActions = signal(true);
  currentPage = signal(1);
  readonly pageSize = 10;
  activeTab = signal<'auth' | 'activity'>('activity');
  actionFilter = '';
  fromDate = '';
  toDate = '';
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private auditLogService: AuditLogService,
    private loginHistoryService: LoginHistoryService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const role = this.auth.currentUser()?.role;
    this.isSuperAdmin = role === UserRole.SUPER_ADMIN;
    if (role === UserRole.SUPER_ADMIN) {
      this.accessMessage.set(
        'Super Admin: can view logs from HR and Interviewer. This page is read-only.',
      );
    } else {
      this.accessMessage.set(
        'HR: can only view logs from Interviewer. This page is read-only.',
      );
    }

    this.loadLogs({ resetPage: true, showErrorToast: true });
    this.startRealtimeRefresh();
  }

  applyFilters() {
    this.loadLogs({ resetPage: true, showErrorToast: true });
  }

  resetFilters() {
    this.actionFilter = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadLogs({ resetPage: true, showErrorToast: true });
  }

  private loadLogs(input: { resetPage: boolean; showErrorToast: boolean }) {
    const from = this.toUtcStartOfDay(this.fromDate);
    const to = this.toUtcEndOfDay(this.toDate);
    const action = this.actionFilter.trim() || undefined;

    this.isLoading.set(true);
    this.auditLogService.getLogs({ limit: 200, action, from, to }).subscribe({
      next: (res) => {
        this.logs.set(res.data ?? []);
        if (input.resetPage) {
          this.currentPage.set(1);
        } else if (this.currentPage() > this.totalPages()) {
          this.currentPage.set(this.totalPages());
        }
      },
      error: (err) => {
        this.logs.set([]);
        if (input.resetPage) this.currentPage.set(1);
        if (input.showErrorToast) {
          this.toast.error(
            err?.error?.message ?? 'Unable to load audit logs. Please try again.',
          );
        }
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

  toggleMyActionsVisibility(): void {
    this.showMyActions.set(!this.showMyActions());
    this.currentPage.set(1);
  }

  switchTab(tab: 'auth' | 'activity'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  private visibleLogs(): AuditLogItem[] {
    if (!this.isSuperAdmin || this.showMyActions()) {
      return this.logs();
    }
    return this.logs().filter(
      (item) => item.actorRoleSnapshot !== UserRole.SUPER_ADMIN,
    );
  }

  private authTimelineLogs(): AuditLogItem[] {
    return this.visibleLogs().filter(
      (item) =>
        item.action === AuditLogComponent.AUTH_LOGIN_ACTION ||
        item.action === AuditLogComponent.AUTH_LOGOUT_ACTION,
    );
  }

  private activityLogs(): AuditLogItem[] {
    return this.visibleLogs().filter(
      (item) => !AuditLogComponent.AUTH_ACTION_PATTERN.test(item.action),
    );
  }

  private currentTabLogs(): AuditLogItem[] {
    return this.activeTab() === 'auth'
      ? this.authTimelineLogs()
      : this.activityLogs();
  }

  pagedLogs(): AuditLogItem[] {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.currentTabLogs().slice(start, end);
  }

  totalPages(): number {
    const total = this.currentTabLogs().length;
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 7;
    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      let start = Math.max(1, current - 3);
      let end = Math.min(total, current + 3);
      if (start <= 2) end = Math.min(start + 6, total);
      if (end >= total - 1) start = Math.max(1, end - 6);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  visibleLogsCount(): number {
    return this.currentTabLogs().length;
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  formatActionLabel(action: string): string {
    return action.replace(/^AUTH_/i, '').replace(/_/g, ' ');
  }

  actorFullName(item: AuditLogItem): string {
    const payload = item.payload ?? {};
    const fromPayload = this.readTextField(payload, 'actorFullName');
    return fromPayload || 'Unknown';
  }

  formatDetails(item: AuditLogItem): string {
    const payload = item.payload ?? {};
    const base = this.buildActionDetail(item.action, payload);

    // Only show IP/Device in Auth Timeline tab
    if (this.activeTab() === 'auth') {
      const ip = this.readTextField(payload, 'ipAddress');
      const userAgent = this.readTextField(payload, 'userAgent');
      const device = this.summarizeUserAgent(userAgent);
      const context =
        [
          ip ? `IP: ${ip} (${this.classifyIp(ip)})` : '',
          device ? `Device: ${device}` : '',
        ]
          .filter(Boolean)
          .join(' | ') || '';
      return [base, context].filter(Boolean).join(' | ') || '—';
    }

    return base || '—';
  }

  formatResource(item: AuditLogItem): string {
    const action = item.action;
    // Extract resource type from action (e.g., VACANCIES_CREATE → Vacancy)
    const match = action.match(/^([A-Z_]+?)_(CREATE|UPDATE|PATCH|DELETE)$/i);
    if (match) {
      const resource = match[1]
        .replace(/_/g, ' ')
        .replace(/S$/i, '')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const targetId = item.targetId;
      return targetId ? `${resource} #${targetId}` : resource;
    }

    // For staff/role actions
    if (action.startsWith('STAFF_') || action === 'ROLE_CHANGED') {
      const targetId = item.targetId;
      return targetId ? `User #${targetId}` : 'Staff';
    }

    return item.targetId ? `#${item.targetId}` : '—';
  }

  viewSession(item: AuditLogItem) {
    if (typeof item.actorId !== 'number') {
      this.toast.warning('Session details are unavailable for this log item.');
      this.selectedSession.set({
        email: 'Unknown user',
        role: item.actorRoleSnapshot,
        loginAt: null,
        logoutAt: null,
        actions: [],
        crudCount: 0,
        otherCount: 0,
      });
      return;
    }

    this.isSessionLoading.set(true);
    forkJoin({
      loginHistory: this.loginHistoryService.getLogs({
        limit: 500,
        status: 'SUCCESS',
      }),
      auditLogs: this.auditLogService.getLogs({ limit: 500 }),
    }).subscribe({
      next: ({ loginHistory, auditLogs }) => {
        const detail = this.buildSessionDetail(
          item.actorId as number,
          item.actorRoleSnapshot,
          loginHistory.data ?? [],
          auditLogs.data ?? [],
          item,
        );
        this.selectedSession.set(detail);
      },
      error: (err) => {
        this.toast.error(
          err?.error?.message ?? 'Unable to load session details. Please try again.',
        );
        this.selectedSession.set(null);
      },
      complete: () => this.isSessionLoading.set(false),
    });
  }

  closeSession() {
    this.selectedSession.set(null);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private buildSessionDetail(
    actorId: number,
    role: string,
    loginHistoryRows: LoginHistoryItem[],
    auditRows: AuditLogItem[],
    selectedItem: AuditLogItem,
  ): UserSessionDetail {
    const userLogins = loginHistoryRows
      .filter((row) => row.userId === actorId && row.status === 'SUCCESS')
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    const actorLogs = auditRows
      .filter((row) => row.actorId === actorId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    const actorLogsAsc = [...actorLogs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const selectedAt = new Date(selectedItem.createdAt).getTime();
    const loginLogsAsc = actorLogsAsc.filter(
      (log) => log.action === AuditLogComponent.AUTH_LOGIN_ACTION,
    );
    const loginForSelected =
      [...loginLogsAsc]
        .reverse()
        .find((log) => new Date(log.createdAt).getTime() <= selectedAt) ?? null;
    const loginAt = loginForSelected?.createdAt ?? userLogins[0]?.createdAt ?? null;
    const sessionStart = loginAt ? new Date(loginAt).getTime() : Number.MIN_SAFE_INTEGER;
    const logoutForSession = actorLogsAsc.find(
      (log) =>
        log.action === AuditLogComponent.AUTH_LOGOUT_ACTION &&
        new Date(log.createdAt).getTime() > sessionStart,
    );
    const logoutAt = logoutForSession?.createdAt ?? null;
    const sessionEnd = logoutAt ? new Date(logoutAt).getTime() : Number.MAX_SAFE_INTEGER;

    const sessionActions = actorLogs
      .filter((row) => {
        const createdAt = new Date(row.createdAt).getTime();
        return createdAt >= sessionStart && createdAt <= sessionEnd;
      })
      .filter((row) => !AuditLogComponent.AUTH_ACTION_PATTERN.test(row.action));

    const crudCount = sessionActions.filter((log) =>
      AuditLogComponent.CRUD_PATTERN.test(log.action),
    ).length;

    return {
      email: userLogins[0]?.email ?? 'Unknown',
      role,
      loginAt,
      logoutAt,
      actions: sessionActions.slice(0, 15),
      crudCount,
      otherCount: sessionActions.length - crudCount,
    };
  }

  private buildActionDetail(
    action: string,
    payload: Record<string, unknown>,
  ): string {
    // --- Staff actions ---
    if (action === 'STAFF_UPDATE') {
      return this.describeStaffUpdate(payload);
    }
    if (action === 'STAFF_CREATE') {
      return this.describeStaffCreate(payload);
    }
    if (action === 'STAFF_ACTIVATE') {
      return 'Account activated';
    }
    if (action === 'STAFF_DEACTIVATE') {
      return 'Account deactivated';
    }
    if (action === 'STAFF_RESEND_INVITE') {
      const mode = this.readTextField(payload, 'mode');
      if (mode === 'PASSWORD_RESET_LINK') {
        return 'Resent invite via password reset link';
      }
      if (mode === 'VERIFY_EMAIL_LINK') {
        return 'Resent invite via email verification link';
      }
      return 'Resent invite';
    }
    if (action === 'ROLE_CHANGED') {
      const fromRole = this.readTextField(payload, 'fromRole');
      const toRole = this.readTextField(payload, 'toRole');
      const reason = this.readTextField(payload, 'reason');
      return [
        fromRole && toRole ? `Role: ${fromRole} -> ${toRole}` : '',
        reason ? `Reason: ${reason}` : '',
      ]
        .filter(Boolean)
        .join(' | ');
    }

    // --- Vacancy actions (route: 'vacancy') ---
    if (action.startsWith('VACANCY_')) {
      const verb = action.includes('CREATE') ? 'Created' : action.includes('DELETE') ? 'Deleted' : 'Updated';
      return this.describeVacancyAction(payload, verb);
    }

    // --- Interview actions (route: 'interviews') ---
    if (action.startsWith('INTERVIEWS_')) {
      const verb = action.includes('CREATE') ? 'Scheduled' : 'Updated';
      return this.describeInterviewAction(payload, verb);
    }

    // --- Application actions (route: 'application') ---
    if (action.startsWith('APPLICATION_')) {
      const verb = action.includes('CREATE') ? 'Created' : 'Updated';
      return this.describeApplicationAction(payload, verb);
    }

    // --- Department actions (route: 'department') ---
    if (action.startsWith('DEPARTMENT_')) {
      const verb = action.includes('CREATE') ? 'Created' : action.includes('DELETE') ? 'Deleted' : 'Updated';
      return this.describeDepartmentAction(payload, verb);
    }

    return this.describeGenericPayload(payload);
  }

  private describeVacancyAction(payload: Record<string, unknown>, verb: string): string {
    const body = this.readObjectField(payload, 'body') ?? payload;
    const title = this.readTextField(body, 'title');
    const status = this.readTextField(body, 'status');
    const parts: string[] = [verb + ' vacancy'];
    if (title) parts.push(`"${title}"`);
    if (status) parts.push(`Status: ${status}`);
    return parts.join(' · ');
  }

  private describeInterviewAction(payload: Record<string, unknown>, verb: string): string {
    const body = this.readObjectField(payload, 'body') ?? payload;
    const title = this.readTextField(body, 'title');
    const vote = this.readTextField(body, 'vote');
    const feedback = this.readTextField(body, 'feedback');
    const status = this.readTextField(body, 'status');
    const parts: string[] = [verb + ' interview'];
    if (title) parts.push(`"${title}"`);
    if (vote) parts.push(`Vote: ${vote}`);
    if (feedback) parts.push(`Feedback: ${feedback.substring(0, 60)}${feedback.length > 60 ? '…' : ''}`);
    if (status) parts.push(`Status: ${status}`);
    return parts.join(' · ');
  }

  private describeApplicationAction(payload: Record<string, unknown>, verb: string): string {
    const body = this.readObjectField(payload, 'body') ?? payload;
    const status = this.readTextField(body, 'status');
    const parts: string[] = [verb + ' application'];
    if (status) parts.push(`Status → ${status}`);
    return parts.join(' · ');
  }

  private describeDepartmentAction(payload: Record<string, unknown>, verb: string): string {
    const body = this.readObjectField(payload, 'body') ?? payload;
    const name = this.readTextField(body, 'name');
    const parts: string[] = [verb + ' department'];
    if (name) parts.push(`"${name}"`);
    return parts.join(' · ');
  }

  private describeStaffCreate(payload: Record<string, unknown>): string {
    const fullName = this.readTextField(payload, 'fullName');
    const email = this.readTextField(payload, 'email');
    const departmentId = this.readNumberField(payload, 'departmentId');
    const position = this.readTextField(payload, 'position');
    const mode = this.readTextField(payload, 'mode');
    return [
      fullName ? `Name: ${fullName}` : '',
      email ? `Email: ${email}` : '',
      position ? `Position: ${position}` : '',
      departmentId !== null ? `Department ID: ${departmentId}` : '',
      mode ? `Mode: ${mode.replace(/_/g, ' ')}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  }

  private describeStaffUpdate(payload: Record<string, unknown>): string {
    const before = this.readObjectField(payload, 'before');
    const after = this.readObjectField(payload, 'after');
    if (!before || !after) {
      return this.describeGenericPayload(payload);
    }

    const fields = ['fullName', 'phone', 'role', 'departmentId', 'position'];
    const changes = fields
      .filter((field) => before[field] !== after[field])
      .map((field) => {
        const label = this.humanizeFieldName(field);
        const oldValue = this.formatUnknown(before[field]);
        const newValue = this.formatUnknown(after[field]);
        return `${label}: ${oldValue} -> ${newValue}`;
      });

    return changes.length ? changes.join(' | ') : 'Updated staff profile';
  }

  private describeGenericPayload(payload: Record<string, unknown>): string {
    // Hide technical fields from interceptor — only show business data
    const hiddenKeys = new Set([
      'ipAddress', 'userAgent', 'actorFullName',
      'method', 'path', 'params', 'query', 'body',
    ]);

    // Try to extract meaningful data from nested body
    const body = this.readObjectField(payload, 'body');
    const source = body ?? payload;
    const text = Object.entries(source)
      .filter(([key]) => !hiddenKeys.has(key))
      .map(([key, value]) => `${this.humanizeFieldName(key)}: ${this.formatUnknown(value)}`);
    return text.length ? text.join(' · ') : '';
  }

  private readObjectField(
    payload: Record<string, unknown>,
    key: string,
  ): Record<string, unknown> | null {
    const value = payload[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return null;
  }

  private readTextField(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    return typeof value === 'string' ? value : '';
  }

  private readNumberField(
    payload: Record<string, unknown>,
    key: string,
  ): number | null {
    const value = payload[key];
    return typeof value === 'number' ? value : null;
  }

  private humanizeFieldName(input: string): string {
    return input
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private summarizeUserAgent(userAgent: string): string {
    if (!userAgent) return '';
    const normalized = userAgent.toLowerCase();
    if (normalized.includes('powershell')) return 'PowerShell';
    if (normalized.includes('edg/')) return 'Microsoft Edge';
    if (normalized.includes('chrome/')) return 'Google Chrome';
    if (normalized.includes('firefox/')) return 'Mozilla Firefox';
    if (normalized.includes('safari/') && normalized.includes('version/')) {
      return 'Safari';
    }
    return 'Unknown Client';
  }

  private startRealtimeRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      this.loadLogs({ resetPage: false, showErrorToast: false });
    }, 5000);
  }

  private toUtcStartOfDay(value: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }

  private toUtcEndOfDay(value: string): string | undefined {
    if (!value) return undefined;
    const date = new Date(`${value}T23:59:59.999`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }

  private classifyIp(ip: string): string {
    const value = ip.trim();
    if (
      value === '::1' ||
      value.startsWith('127.') ||
      value.toLowerCase() === 'localhost'
    ) {
      return 'localhost';
    }
    if (
      value.startsWith('10.') ||
      value.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
    ) {
      return 'private network';
    }
    return 'public network';
  }

  private formatUnknown(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  }
}

interface UserSessionDetail {
  email: string;
  role: string;
  loginAt: string | null;
  logoutAt: string | null;
  actions: AuditLogItem[];
  crudCount: number;
  otherCount: number;
}
