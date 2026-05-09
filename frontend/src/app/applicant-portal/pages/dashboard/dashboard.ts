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

  isApplyModalOpen = false;
  selectedJobTitle = '';
  applyForm = { applicantId: '', vacancyId: '' };
  myCvs = signal<any[]>([]);
  selectedCvId = signal<string | null>(null);
  loading = signal(false);

  private applicationService = inject(ApplicationService);
  private authService = inject(AuthService);
  private applicantService = inject(ApplicantService);
  private toast = inject(ToastService);
  private interviewService = inject(InterviewService);
  private favoriteJobService = inject(FavoriteJobService);

  // NGONINIT GỐC (CHỈ THÊM 2 DÒNG GỌI HÀM MỚI BÊN DƯỚI)
  ngOnInit(): void {
    const applicantId = this.authService.currentUser()?.applicantId;
    // Đoạn code gốc của team:
    this.applicationService
      .getAll({
        applicantId: this.authService.currentUser()?.applicantId,
      })
      .subscribe({
        next: (res) => {
          this.applications.set((res.data as any)?.items) ?? [];
        },
      });

    // Đoạn code mới thêm vào:
    this.loadSavedJobs();
    this.fetchUserCvs();

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
      this.applicationService.getAll({ applicantId: userId }).subscribe({
        next: (res: any) => {
          const items = res.data?.items ?? res.data ?? [];
          this.applications.set(items);
        }
      });
    }
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
      [ApplicationStatus.PENDING]: 'bg-blue-50 text-blue-600 border-blue-100',
      [ApplicationStatus.SCREENING]: 'bg-amber-50 text-amber-600 border-amber-100',
      [ApplicationStatus.SELECTED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
    return map[status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
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
    this.applyForm.vacancyId = job.id ?? job.vacancyId ?? '';
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
    const dto: CreateApplicationDto = {
      applicantId: this.authService.currentUser()?.applicantId ?? '',
      vacancyId: this.applyForm.vacancyId,
      cvId: this.selectedCvId()!,
    };
    this.applicationService.create(dto).subscribe({
      next: () => {
        this.toast.success('Application submitted successfully');
        this.closeApplyModal();
        this.loading.set(false);
        this.fetchApplications();
      },
      error: () => {
        this.toast.error('Failed to submit application');
        this.loading.set(false);
      },
    });
  }
}
