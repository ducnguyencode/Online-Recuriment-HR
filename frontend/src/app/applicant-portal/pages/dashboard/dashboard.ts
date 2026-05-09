import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationStatus } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { CreateApplicationDto } from '../../../core/services/application.service';
import { InterviewService } from '../../../core/services/interview.service';
import { ApplicantService } from '../../../core/services/applicant.service';
import { FavoriteJobService } from '../../../core/services/favorite-job.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  applications = signal<any[]>([]);
  savedJobs = signal<any[]>([]);
  activeTab = signal<'APPLIED' | 'SAVED' | 'INTERVIEWS'>('APPLIED');

  interviews = signal<any[]>([]);

  // Pagination for applications
  appCurrentPage = signal(1);
  appTotalPages = signal(1);
  appTotalItems = signal(0);
  readonly appPageSize = 10;

  isApplyModalOpen = false;
  selectedJobTitle = '';
  applyForm = { applicantId: '', vacancyId: '' };
  myCvs = signal<any[]>([]);
  selectedCvId = signal<string | null>(null);
  loading = signal(false);
  expandedAppId = signal<number | null>(null);

  private applicationService = inject(ApplicationService);
  private authService = inject(AuthService);
  private applicantService = inject(ApplicantService);
  private toast = inject(ToastService);
  private interviewService = inject(InterviewService);
  private favoriteJobService = inject(FavoriteJobService);

  ngOnInit(): void {
    this.fetchApplications();
    this.loadSavedJobs();
    this.fetchUserCvs();

    const applicantId = this.authService.currentUser()?.applicantId;
    if (applicantId) {
      this.interviewService.getAll({ applicantId: applicantId }).subscribe({
        next: (res) => {
          this.interviews.set((res.data as any)?.items) ?? [];
        }
      });
    }
  }

  fetchApplications() {
    const userId = this.authService.currentUser()?.applicantId;
    if (userId) {
      this.applicationService.getAll({
        applicantId: userId,
        page: this.appCurrentPage(),
        limit: this.appPageSize,
      }).subscribe({
        next: (res: any) => {
          const data = res.data;
          const items = data?.items ?? data ?? [];
          this.applications.set(items);
          this.appTotalItems.set(data?.totalItems ?? data?.total ?? items.length);
          this.appTotalPages.set(data?.totalPages ?? Math.max(1, Math.ceil(this.appTotalItems() / this.appPageSize)));
        }
      });
    }
  }

  onAppPageChange(page: number) {
    if (page < 1 || page > this.appTotalPages()) return;
    this.appCurrentPage.set(page);
    this.fetchApplications();
  }

  getAppPageNumbers(): number[] {
    const total = this.appTotalPages();
    const current = this.appCurrentPage();
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  loadSavedJobs() {
    this.favoriteJobService.getSavedList().subscribe({
      next: (jobs) => this.savedJobs.set(jobs),
      error: () => this.savedJobs.set([]),
    });
  }

  unsaveJob(jobId: string) {
    this.favoriteJobService.toggle(jobId).subscribe({
      next: (res: any) => {
        if (!res.data?.saved) {
          this.savedJobs.update(jobs => jobs.filter(j => j.id !== jobId));
          this.toast.success('Job removed from saved list');
        }
      },
      error: (err: any) => this.toast.error(err.error?.message || 'Failed to unsave'),
    });
  }

  getStatusClass(status: ApplicationStatus): string {
    const map: any = {
      [ApplicationStatus.PENDING]: 'bg-slate-50 text-slate-500 border-slate-200',
      [ApplicationStatus.SCREENING]: 'bg-amber-50 text-amber-600 border-amber-100',
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 'bg-blue-50 text-blue-600 border-blue-100',
      [ApplicationStatus.PENDING_REVIEW]: 'bg-amber-50 text-amber-600 border-amber-100',
      [ApplicationStatus.SELECTED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      [ApplicationStatus.ACCEPTED]: 'bg-green-50 text-green-700 border-green-200',
      [ApplicationStatus.REJECTED]: 'bg-red-50 text-red-600 border-red-100',
    };
    return map[status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
  }

  toggleAppDetail(appId: number) {
    this.expandedAppId.set(this.expandedAppId() === appId ? null : appId);
  }

  fetchUserCvs() {
    const applicantId = this.authService.currentUser()?.applicantId;
    if (!applicantId) return;
    this.applicationService.getMyCvs(applicantId).subscribe({
      next: (res: any) => {
        this.myCvs.set(res.data?.items ?? res.data ?? []);
      },
    });
  }

  applySavedJob(job: any) {
    this.selectedJobTitle = job.title ?? job.jobTitle ?? '';
    this.isApplyModalOpen = true;
    this.applyForm.vacancyId = job.vacancyId ?? job.vacancy?.id ?? job.id ?? '';
    this.applyForm.applicantId = this.authService.currentUser()?.applicantId ?? '';
  }

  closeApplyModal() {
    this.isApplyModalOpen = false;
    this.selectedCvId.set(null);
  }

  submitApplication() {
    if (!this.selectedCvId()) {
      this.toast.warning('Please select a CV');
      return;
    }
    this.loading.set(true);
    const dto: any = {
      applicantId: Number(this.authService.currentUser()?.applicantId),
      vacancyId: Number(this.applyForm.vacancyId),
      cvId: Number(this.selectedCvId()),
    };
    this.applicationService.create(dto).subscribe({
      next: () => {
        this.toast.success('Application submitted successfully');
        this.closeApplyModal();
        this.loading.set(false);
        this.fetchApplications();
        this.loadSavedJobs();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to submit application');
        this.loading.set(false);
      },
    });
  }
}
