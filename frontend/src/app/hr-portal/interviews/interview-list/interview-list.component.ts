import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InterviewService } from '../../../core/services/interview.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import {
  Interview,
  InterviewerPanel,
  InterviewStatus,
  formatDisplayId,
} from '../../../core/models';

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

  filterStatus = '';
  filterDate = '';
  searchTerm = '';

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

  constructor(
    private auth: AuthService,
    private interviewService: InterviewService,
    private mockData: MockDataService,
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const params = {
      ...(this.filterStatus ? { status: this.filterStatus } : {}),
      ...(this.filterDate ? { date: this.filterDate } : {}),
      ...(this.searchTerm.trim() ? { search: this.searchTerm.trim() } : {}),
    };
    this.interviewService.getAll(params).subscribe({
      next: (res) => {
        const items: Interview[] = (res.data as any)?.items ?? [];
        this.interviews.set(items);
        this.loading.set(false);
      },
      error: () => {
        const raw = this.mockData.getInterviews() as any[];
        const mapped: Interview[] = raw.map((r) => this.mapMockInterview(r));
        const filtered = mapped.filter((i) => {
          if (this.filterStatus && i.status !== this.filterStatus) return false;
          if (this.filterDate && i.interviewDate !== this.filterDate)
            return false;
          return true;
        });
        this.interviews.set(filtered);
        this.loading.set(false);
      },
    });
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
    const formatTime = (dateObj: Date) => {
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    // const formatTime = (isoString: string) => {
    //   if (!isoString) return '';
    //   const date = new Date(isoString);
    //   return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    // };

    // return {
    //   id: String(r.id),
    //   applicationId: String(r.applicationId),
    //   application: application as any,
    //   title: r.title ?? 'Interview with ${r.applicantName}',
    //   description: r.description ?? '',
    //   googleMeetLink: r.googleMeetLink ?? r.meetLink,
    //   interviewDate: (r.date ?? r.interviewDate ?? '').substring(0, 10),
    //   startTime: r.startTime ?? r.time ?? '',
    //   endTime: r.endTime ?? '',
    //   platform: r.platform ?? 'Google Meet',
    //   meetLink: r.meetLink,
    //   status: r.status ?? 'Scheduled',
    //   panel: Array.isArray(r.panel)
    //     ? r.panel
    //     : (Array.isArray(r.interviewers)
    //       ? r.interviewers.map((name: string) => ({ employeeId: name, fullName: name, role: 'Interviewer', vote: 'Pending' as any }))
    //       : []),
    //   createdAt: r.createdAt ?? '',
    //   updatedAt: r.updatedAt ?? '',
    // };
    return {
      ...r,
      id: String(r.id),
      title: r.title || `Interview with ${applicantName}`,
      interviewDate: r.startTime ? new Date(r.startTime).toISOString().split('T')[0] : '',
      startTime: formatTime(r.startTime),
      endTime: formatTime(r.endTime),
      status: r.status || 'Scheduled',
      panel: r.panels || [],
      googleMeetLink: r.meetLink || r.googleMeetLink
    };

  }

  filteredInterviews(): Interview[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.interviews().filter((i) => {
      if (this.filterStatus && i.status !== this.filterStatus) return false;
      if (this.filterDate && i.interviewDate !== this.filterDate) return false;
      if (!term) return true;

      const values = [
        i.id,
        i.applicationId,
        i.applicant?.id,
        i.vacancy?.id,
        i.application?.applicantId,
        i.application?.vacancyId,
        i.applicant?.code,
        i.vacancy?.code,
        i.application?.applicant?.fullName,
        i.application?.vacancy?.title,
        i.applicant?.fullName,
        i.vacancy?.title,
      ];

      return values.some((value) => (value ?? '').toLowerCase().includes(term));
    });
  }

  openDetail(item: Interview) {
    this.selectedInterview.set(item);
    this.showDetail.set(true);
  }

  onSearchChange() {
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
    if (new Date(interviewDate) <= new Date()) {
      this.postponeError = 'Interview date must be in the future.';
      return;
    }
    if (startTime >= endTime) {
      this.postponeError = 'End time must be after start time.';
      return;
    }
    if (interview) {
      const panelIds = interview.panel.map((item) => item.employeeId);
      const interviewerConflicts = this.mockData.getInterviewerConflicts(
        panelIds,
        interviewDate,
        startTime,
        endTime,
        this.postponeInterviewId,
      );
      if (interviewerConflicts.length > 0) {
        this.postponeError = `Conflict: ${interviewerConflicts.join(', ')} already has another interview at this time.`;
        return;
      }

      const applicantId =
        interview.application?.applicantId ?? interview.applicant?.id;
      if (applicantId) {
        const applicantConflicts = this.mockData.getApplicantInterviewConflicts(
          applicantId,
          interviewDate,
          startTime,
          endTime,
          this.postponeInterviewId,
        );
        if (applicantConflicts.length > 0) {
          this.postponeError =
            'This applicant already has another interview at the selected time.';
          return;
        }
      }
    }

    const startISO = `${interviewDate}T${startTime}:00`;
    const endISO = `${interviewDate}T${endTime}:00`;

    const payload = {
      title: this.selectedInterview()?.title || 'Rescheduled Interview',
      description: reason,
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
    if (!confirm('Cancel this interview?')) return;
    this.interviewService.updateStatus(item.id, 'Cancelled').subscribe({
      next: () => this.loadData(),
      error: () => {
        this.interviews.update((list) =>
          list.map((i) =>
            i.id !== item.id
              ? i
              : { ...i, status: 'Cancelled' as InterviewStatus },
          ),
        );
      },
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  getApplicantName(item: Interview): string {
    // return item.application?.applicant?.fullName ?? item.applicant?.fullName ?? '—';
    return item.application?.applicant?.user?.fullName
      ?? item.applicant?.user?.fullName
      ?? '—';
  }

  applicantDisplayId(id?: string) {
    return formatDisplayId('A', id);
  }

  vacancyDisplayId(id?: string) {
    return formatDisplayId('V', id);
  }

  applicationDisplayId(id?: string) {
    return formatDisplayId('R', id);
  }

  canSubmitResult(): boolean {
    return this.auth.isInterviewer();
  }

  canReschedule(): boolean {
    return this.auth.isHR();
  }

  canCancel(): boolean {
    return this.auth.isHR();
  }

  getVacancyTitle(item: Interview): string {
    // return item.application?.vacancy?.title ?? item.vacancy?.title ?? '—';
    return item.application?.applicant?.user?.email
      ?? item.applicant?.user?.email
      ?? '—';
  }

  getApplicantEmail(item: Interview): string {
    // return item.application?.applicant?.email ?? item.applicant?.email ?? '—';
    return item.application?.applicant?.user?.email
      ?? item.applicant?.user?.email
      ?? '—';
  }

  getApplicantId(item: Interview): string | undefined {
    // return item.application?.applicantId ?? item.applicant?.id;
    return item.application?.applicantId
      ?? item.applicant?.id
      ?? '—';
  }

  getVacancyId(item: Interview): string | undefined {
    // return item.application?.vacancyId ?? item.vacancy?.id;
    return item.application?.vacancyId
      ?? item.vacancy?.id
      ?? '—';
  }

  clearFilters() {
    this.filterStatus = '';
    this.filterDate = '';
    this.searchTerm = '';
    this.loadData();
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
}
