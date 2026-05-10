import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InterviewService } from '../../../core/services/interview.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import {
  Interview,
  InterviewerPanel,
  InterviewStatus,
  formatDisplayId,
  UserRole,
} from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-interview-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './interview-list.component.html',
  styleUrl: './interview-list.component.scss',
})
export class InterviewListComponent implements OnInit {
  InterviewStatus = InterviewStatus;
  interviews = signal<Interview[]>([]);
  loading = signal(false);

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  readonly pageSize = 10;

  filterStatus = '';
  filterStartDate = '';
  filterEndDate = '';
  filterInterviewer = '';
  searchTerm = '';

  // Interviewer list for dropdown
  interviewerList: { id: string; name: string }[] = [];

  // Detail dialog
  showDetail = signal(false);
  selectedInterview = signal<Interview | null>(null);

  // Submit result dialog
  showResultDialog = signal(false);
  resultData = { vote: '' as 'Pass' | 'Fail' | '', feedback: '' };
  resultError = '';
  resultInterviewId = '';

  // Postpone dialog
  showPostponeDialog = signal(false);
  postponeInterviewId = '';
  postponeData = {
    interviewDate: '',
    startTime: '09:00',
    endTime: '10:00',
    reason: '',
  };
  postponeError = '';

  // Cancel Confirm Dialog
  showCancelConfirm = signal(false);
  itemToCancel = signal<Interview | null>(null);

  constructor(
    protected auth: AuthService,
    private interviewService: InterviewService,
    private employeeService: EmployeeService,
    private mockData: MockDataService,
    private toastService: ToastService,
  ) { }

  ngOnInit() {
    const refresh = this.auth.refreshMe();
    if (refresh) {
      refresh.subscribe({
        next: () => this.initializePage(),
        error: () => this.initializePage(),
      });
      return;
    }
    this.initializePage();
  }

  private initializePage() {
    this.loadInterviewers();
    this.loadData();
  }

  loadInterviewers() {
    if (this.auth.isInterviewer()) {
      const current = this.auth.currentUser();
      this.interviewerList = current?.employeeId
        ? [{ id: String(current.employeeId), name: current.fullName }]
        : [];
      return;
    }

    this.employeeService.getAll({ role: 'Interviewer', limit: 200 }).subscribe({
      next: (res) => {
        const items: any[] = (res.data as any)?.items ?? [];
        this.interviewerList = items.map((e: any) => ({
          id: String(e.id),
          name: e.user?.fullName || e.fullName || 'Unknown',
        }));
      },
      error: () => { /* silent */ },
    });
  }

  loadData() {
    this.loading.set(true);
    const currentEmployeeId = this.currentEmployeeId();

    const params: Record<string, any> = {
      ...(this.filterStatus ? { status: this.filterStatus } : {}),
      ...(this.filterStartDate ? { startDate: this.filterStartDate } : {}),
      ...(this.filterEndDate ? { endDate: this.filterEndDate } : {}),
      ...(this.filterInterviewer ? { employeeId: this.filterInterviewer } : {}),
      ...(this.searchTerm.trim() ? { search: this.searchTerm.trim() } : {}),
      page: this.currentPage(),
      limit: this.pageSize,
    };

    if (this.auth.isInterviewer()) {
      if (currentEmployeeId) {
        params['employeeId'] = currentEmployeeId;
      }
    }
    this.interviewService.getAll(params).subscribe({
      next: (res) => {
        const items: any[] = (res.data as any)?.items ?? [];
        const total = (res.data as any)?.totalItems ?? items.length;
        let mapped: Interview[] = items.map(item => this.mapInterviewData(item));
        if (this.auth.isInterviewer() && currentEmployeeId) {
          mapped = this.filterForCurrentInterviewer(mapped);
        }
        const visibleTotal = this.auth.isInterviewer() ? mapped.length : total;
        const pages =
          this.auth.isInterviewer()
            ? Math.max(1, Math.ceil(visibleTotal / this.pageSize))
            : (res.data as any)?.totalPages ?? Math.max(1, Math.ceil(total / this.pageSize));
        this.interviews.set(mapped);
        this.totalItems.set(visibleTotal);
        this.totalPages.set(pages);
        this.loading.set(false);
      },
      error: () => {
        const raw = this.mockData.getInterviews() as any[];
        const mapped: Interview[] = raw.map((r) => this.mapMockInterview(r));
        let filtered = mapped.filter((i) => {
          if (this.filterStatus && i.status !== this.filterStatus) return false;
          if (this.filterStartDate && i.interviewDate < this.filterStartDate) return false;
          if (this.filterEndDate && i.interviewDate > this.filterEndDate) return false;
          return true;
        });
        if (this.auth.isInterviewer()) {
          filtered = this.filterForCurrentInterviewer(filtered);
        }
        this.interviews.set(filtered);
        this.totalItems.set(filtered.length);
        this.totalPages.set(Math.max(1, Math.ceil(filtered.length / this.pageSize)));
        this.loading.set(false);
      },
    });
  }

  private currentEmployeeId(): string {
    const employeeId = this.auth.currentUser()?.employeeId;
    return employeeId ? String(employeeId) : '';
  }

  private filterForCurrentInterviewer(items: Interview[]): Interview[] {
    const employeeId = this.currentEmployeeId();
    if (!employeeId) return [];
    return items.filter((item) => this.isMyInterview(item, employeeId));
  }

  private isMyInterview(item: Interview, employeeId: string): boolean {
    const panel = item.panel ?? item.panels ?? [];
    return panel.some((p) => String(p.employeeId) === employeeId);
  }

  private mapInterviewData(r: any): Interview {
    let application = r.application;
    const applicantName = r.application?.applicant?.user?.fullName || 'N/A';
    if (!application) {
      const apps = this.mockData.getApplications();
      const found = apps.find((a) => String(a.id) === String(r.applicationId));
      if (found) {
        application = {
          ...found,
          id: String(found.id),
          applicantId: String(found.applicantId),
          vacancyId: String(found.vacancyId),
        };
      }
    }
    const formatTime = (isoString: string) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };
    const datePart = r.startTime ? new Date(r.startTime).toISOString().split('T')[0] : '';
    const app = r.application || {};
    const applicant = app.applicant || {};
    const vacancy = app.vacancy || {};
    const user = applicant.user || {};

    console.log('Test Vacancy Data:', vacancy);
    return {
      id: String(r.id),
      applicationId: String(r.applicationId),
      application: {
        ...app,
        applicant: {
          fullName: user.fullName || 'N/A',
          email: user.email || 'N/A',
          cvUrl: app.cv?.fileUrl || ''
        },
        vacancy: {
          title: vacancy.title || 'N/A',
          departmentName: vacancy.department?.name || 'N/A',
          description: vacancy.description || '',
          requirements: vacancy.requirements || ''
        }
      } as any,
      title: r.title ?? `Interview with ${user.fullName || 'Candidate'}`,
      description: r.description ?? '',
      googleMeetLink: r.googleMeetLink ?? r.meetLink,
      interviewDate: datePart,
      startTime: formatTime(r.startTime),
      endTime: formatTime(r.endTime),
      platform: r.platform ?? 'Google Meet',
      meetLink: r.meetLink,
      status: r.status ?? 'Scheduled',
      panel: (r.panels || r.panel || []).map((p: any) => ({
        ...p,
        employeeId: p.employeeId || p.employee?.id,
        fullName: p.employee?.user?.fullName || p.employee?.fullName || p.fullName || 'Interviewer',
        role: p.role || 'Interviewer',
        vote: p.vote || 'Pending'
      })),
      createdAt: r.createdAt ?? '',
      updatedAt: r.updatedAt ?? '',
    };
  }

  private mapMockInterview(r: any): Interview {
    // r.application is undefined in mock data — look up from mock store
    let application = r.application;
    const applicantName = r.application?.applicant?.user?.fullName || 'N/A';
    if (!application) {
      const apps = this.mockData.getApplications();
      const found = apps.find((a) => String(a.id) === String(r.applicationId));
      if (found) {
        application = {
          ...found,
          id: String(found.id),
          applicantId: String(found.applicantId),
          vacancyId: String(found.vacancyId),
        };
      }
    }

    // Format HH:mm for the UI display
    const formatTime = (isoString: string) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    return {
      id: String(r.id),
      applicationId: String(r.applicationId),
      application: application as any,
      title: r.title ?? 'Interview with ${r.applicantName}',
      description: r.description ?? '',
      googleMeetLink: r.googleMeetLink ?? r.meetLink,
      interviewDate: (r.date ?? r.interviewDate ?? '').substring(0, 10),
      startTime: r.startTime ?? r.time ?? '',
      endTime: r.endTime ?? '',
      platform: r.platform ?? 'Google Meet',
      meetLink: r.meetLink,
      status: r.status ?? 'Scheduled',
      panel: Array.isArray(r.panel)
        ? r.panel
        : (Array.isArray(r.interviewers)
          ? r.interviewers.map((name: string) => ({ employeeId: name, fullName: name, role: 'Interviewer', vote: 'Pending' as any }))
          : []),
      createdAt: r.createdAt ?? '',
      updatedAt: r.updatedAt ?? '',
    };
  }

  filteredInterviews(): Interview[] {
    // Backend already filters by status, date, and search.
    // Just return the loaded interviews directly.
    return this.interviews();
  }

  openDetail(item: Interview) {
    this.selectedInterview.set(item);
    this.showDetail.set(true);
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadData();
  }

  closeDetail() {
    this.showDetail.set(false);
    this.selectedInterview.set(null);
  }

  // ── Submit Result ────────────────────────────────────────────────────────

  openResultDialog(item: Interview, event: Event) {
    event.stopPropagation();
    if (!this.canSubmitResult()) return;
    this.resultInterviewId = item.id;
    this.resultData = { vote: '', feedback: '' };
    this.resultError = '';
    this.showResultDialog.set(true);
  }

  closeResultDialog() {
    this.showResultDialog.set(false);
    this.resultError = '';
  }

  // ── Postpone / Reschedule ────────────────────────────────────────────────

  openPostponeDialog(item: Interview, event: Event) {
    event.stopPropagation();
    if (!this.canReschedule()) return;
    this.postponeInterviewId = item.id;
    this.postponeData = {
      interviewDate: item.interviewDate,
      startTime: item.startTime,
      endTime: item.endTime,
      reason: '',
    };
    this.postponeError = '';
    this.showPostponeDialog.set(true);
  }

  onPostponeStartTimeChange(startTime: string) {
    if (!startTime) return;
    const [h, m] = startTime.split(':').map(Number);
    const endH = (h + 1) % 24;
    this.postponeData.endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  closePostponeDialog() {
    this.showPostponeDialog.set(false);
    this.postponeError = '';
  }

  savePostpone() {
    const { interviewDate, startTime, endTime, reason } = this.postponeData;
    const interview = this.interviews().find(
      (item) => item.id === this.postponeInterviewId,
    );
    if (!interviewDate || !startTime || !endTime) {
      this.postponeError = 'Date, start time and end time are required.';
      return;
    }

    const startDateTime = new Date(`${interviewDate}T${startTime}:00`);
    const bufferTime = new Date(Date.now() + 60 * 60 * 1000); // now + 1 hour
    if (startDateTime <= bufferTime) {
      this.postponeError = 'Start time must be at least 1 hour from now.';
      return;
    }
    if (startTime >= endTime) {
      this.postponeError = 'End time must be after start time.';
      return;
    }

    const startISO = `${interviewDate}T${startTime}:00`;
    const endISO = `${interviewDate}T${endTime}:00`;

    const payload = {
      title: this.selectedInterview()?.title || 'Rescheduled Interview',
      description: reason ? String(reason) : '',
      startTime: startISO,
      endTime: endISO
    };

    this.interviewService.reschedule(this.postponeInterviewId, payload).subscribe({
      next: () => {
        this.closePostponeDialog();
        this.loadData();
      },
      error: (err) => {
        this.postponeError = 'Could not reschedule. Please check your connection or HR availability.';
      }
    });

    // this.interviewService.reschedule(this.postponeInterviewId, { interviewDate, startTime, endTime, reason }).subscribe({
    //   next: () => {
    //     this.closePostponeDialog();
    //     this.loadData();
    //   },
    //   error: () => {
    //     this.interviews.update(list =>
    //       list.map(i => i.id !== this.postponeInterviewId ? i : {
    //         ...i,
    //         interviewDate,
    //         startTime,
    //         endTime,
    //         status: 'Postponed' as InterviewStatus,
    //       })
    //     );
    //     this.closePostponeDialog();
    //   }
    // });
  }

  submitResult() {
    if (!this.resultData.vote) {
      this.resultError = 'Please select a vote result.';
      return;
    }
    if (!this.resultData.feedback.trim()) {
      this.resultError = 'Feedback is required.';
      return;
    }

    this.interviewService
      .submitResult(this.resultInterviewId, {
        vote: this.resultData.vote as 'Pass' | 'Fail',
        feedback: this.resultData.feedback,
      })
      .subscribe({
        next: () => {
          this.closeResultDialog();
          this.loadData();
        },
        error: () => {
          // Mock fallback: update locally
          this.interviews.update((list) =>
            list.map((i) =>
              i.id !== this.resultInterviewId
                ? i
                : {
                  ...i,
                  status: 'Completed' as InterviewStatus,
                  panel: i.panel.map((p) => ({
                    ...p,
                    vote: this.resultData.vote as any,
                    feedback: this.resultData.feedback,
                  })),
                },
            ),
          );
          this.closeResultDialog();
        },
      });
  }

  // ── Cancel / Postpone ───────────────────────────────────────────────────

  cancelInterview(item: Interview, event: Event) {
    event.stopPropagation();
    if (!this.canCancel()) return;
    // if (!confirm('Cancel this interview?')) return;
    this.itemToCancel.set(item);
    this.showCancelConfirm.set(true);
    // this.interviewService.updateStatus(item.id, 'Cancelled').subscribe({
    //   next: () => this.loadData(),
    //   error: () => {
    //     this.interviews.update((list) =>
    //       list.map((i) =>
    //         i.id !== item.id
    //           ? i
    //           : { ...i, status: 'Cancelled' as InterviewStatus },
    //       ),
    //     );
    //   },
    // });
  }

  closeCancelConfirm() {
    this.showCancelConfirm.set(false);
    this.itemToCancel.set(null);
  }

  executeCancel() {
    const item = this.itemToCancel();
    if (!item) return;

    this.interviewService.updateStatus(item.id, 'Cancelled').subscribe({
      next: () => {
        this.toastService.success('Interview cancelled successfully.');
        this.loadData();
        this.closeCancelConfirm();
      },
      error: () => {
        this.toastService.error('Failed to cancel. Please try again.');
        // Fallback cho Mock Data
        this.interviews.update((list) =>
          list.map((i) => (i.id !== item.id ? i : { ...i, status: 'Cancelled' as InterviewStatus }))
        );
        this.closeCancelConfirm();
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  getApplicantName(item: Interview): string {
    // return item.application?.applicant?.fullName ?? item.applicant?.fullName ?? '—';
    return item.application?.applicant?.user?.fullName
      ?? item.application?.applicant?.fullName
      ?? item.applicant?.fullName
      ?? '—';
  }

  applicantDisplayId(id?: string) {
    // return formatDisplayId('A', id);
    return formatDisplayId('A', String(id));
  }

  vacancyDisplayId(id?: string) {
    // return formatDisplayId('V', id);
    return formatDisplayId('V', String(id));
  }

  applicationDisplayId(id?: string) {
    // return formatDisplayId('R', id);
    return formatDisplayId('R', String(id));
  }

  canSubmitResult(): boolean {
    return this.auth.isInterviewer();
  }

  canReschedule(): boolean {
    const role = this.auth.currentUser()?.role;
    return this.auth.isHR() || role === UserRole.SUPER_ADMIN || role === UserRole.HR;
  }

  canCancel(): boolean {
    const role = this.auth.currentUser()?.role;
    return this.auth.isHR() || role === UserRole.SUPER_ADMIN || role === UserRole.HR;
  }

  getVacancyTitle(item: Interview): string {
    return item.application?.vacancy?.title ?? item.vacancy?.title ?? '—';
  }

  getApplicantEmail(item: Interview): string {
    return item.application?.applicant?.email ?? item.applicant?.email ?? '—';
  }

  getApplicantId(item: Interview): string | undefined {
    return item.application?.applicantId ?? item.applicant?.id;
  }

  getVacancyId(item: Interview): string | undefined {
    return item.application?.vacancyId ?? item.vacancy?.id;
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.filterInterviewer = '';
    this.searchTerm = '';
    this.currentPage.set(1);
    this.loadData();
  }

  // ── Pagination ──────────────────────────────────────────────────────────

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  getPanelVoteSummary(panel: InterviewerPanel[]): string {
    const pass = panel.filter((p) => p.vote === 'Pass').length;
    const fail = panel.filter((p) => p.vote === 'Fail').length;
    const pending = panel.filter((p) => p.vote === 'Pending').length;
    const parts: string[] = [];
    if (pass > 0) parts.push(`${pass} Pass`);
    if (fail > 0) parts.push(`${fail} Fail`);
    if (pending > 0) parts.push(`${pending} Pending`);
    return parts.join(' · ') || 'No votes';
  }

  getInterviewerNames(panel: InterviewerPanel[]): string {
    if (!panel || panel.length === 0) return 'No interviewer';
    const names = panel.map(p => p.fullName || 'Unknown').join(', ');
    return names;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Scheduled: 'badge-info',
      Completed: 'badge-success',
      Cancelled: 'badge-danger',
      Postponed: 'badge-warning',
    };
    return map[status] ?? 'badge-neutral';
  }

  getVoteClass(vote: string | undefined): string {
    if (vote === 'Pass') return 'vote-pass';
    if (vote === 'Fail') return 'vote-fail';
    return 'vote-pending';
  }

  getPlatformIcon(platform: string): string {
    const map: Record<string, string> = {
      'Google Meet': '📹',
      Zoom: '💻',
      'On-site': '🏢',
    };
    return map[platform] ?? '📹';
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  getConnectorColor(status: string): string {
    if (status === 'Scheduled') return '#3B82F6';
    if (status === 'Completed') return '#22C55E';
    if (status === 'Cancelled') return '#EF4444';
    if (status === 'Postponed') return '#F59E0B';
    return '#94A3B8';
  }

  isBeforeStartTime(item: Interview | null): boolean {
    if (!item || !item.interviewDate || !item.startTime) return false;

    const startDateTimeStr = `${item.interviewDate}T${item.startTime}:00`;
    const startDateTime = new Date(startDateTimeStr);

    return new Date() < startDateTime;
  }
}
