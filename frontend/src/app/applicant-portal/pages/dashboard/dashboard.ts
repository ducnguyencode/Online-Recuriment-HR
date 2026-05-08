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

  // private applicationService = inject(ApplicationService);
  // private authService = inject(AuthService);
  private applicantService = inject(ApplicantService);
  private toast = inject(ToastService);

  // CONSTRUCTOR GỐC (GIỮ NGUYÊN KHÔNG ĐỤNG CHẠM)
  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
    private interviewService: InterviewService,
  ) { }

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
    const saved = localStorage.getItem('saved_jobs');
    if (saved) this.savedJobs.set(JSON.parse(saved));
  }

  unsaveJob(jobId: string) {
    this.savedJobs.update(jobs => {
      const filtered = jobs.filter(j => j.id !== jobId);
      localStorage.setItem('saved_jobs', JSON.stringify(filtered));
      return filtered;
    });
    this.toast.success('Job removed from saved list');
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
    if (this.authService.isLoggedIn()) {
      this.applicantService.findAllCvByApplicantId(this.authService.currentUser()?.applicantId || '').subscribe((res) => this.myCvs.set(res.data));
    }
  }

  applySavedJob(job: any) {
    this.selectedJobTitle = job.title;
    this.selectedCvId.set(null);
    this.applyForm = { applicantId: this.authService.currentUser()?.applicantId || '', vacancyId: job.id };
    this.isApplyModalOpen = true;
  }

  closeApplyModal() {
    this.isApplyModalOpen = false;
  }

  submitApplication() {
    if (!this.selectedCvId()) {
      this.toast.error('Please select a resume to apply!');
      return;
    }
    this.loading.set(true);
    const dto: CreateApplicationDto = { applicantId: this.applyForm.applicantId, vacancyId: this.applyForm.vacancyId, cvId: this.selectedCvId() as string };

    this.applicationService.applicantCreate(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeApplyModal();
        this.toast.success('Applied successfully!');

        // Refresh lại tab Đã nộp bằng cách gọi lại y chang đoạn logic trong ngOnInit của team
        this.applicationService.getAll({ applicantId: this.authService.currentUser()?.applicantId }).subscribe({
          next: (res) => { this.applications.set((res.data as any)?.items) ?? []; }
        });

        this.unsaveJob(this.applyForm.vacancyId); // Gỡ khỏi tab đã lưu
        this.activeTab.set('APPLIED'); // Chuyển về tab đã nộp
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Application failed.');
      },
    });
  }
}
