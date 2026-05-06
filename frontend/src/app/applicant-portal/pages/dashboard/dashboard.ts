import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Thêm để dùng routerLink
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { Application, ApplicationStatus } from '../../../core/models';
// CÁC SERVICE MỚI CẦN CHO TAB ĐÃ LƯU
import { ApplicantService } from '../../../core/services/applicant.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateApplicationDto } from '../../../core/services/application.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  // BIẾN CŨ CỦA TEAM
  applications = signal<Application[]>([]);
  showToast = false;
  toastMessage = '';

  // --- BIẾN MỚI THÊM CHO TÍNH NĂNG ĐÃ LƯU VÀ NỘP CV ---
  savedJobs = signal<any[]>([]);
  activeTab = signal<'APPLIED' | 'SAVED'>('APPLIED');

  isApplyModalOpen = false;
  selectedJobTitle = '';
  applyForm = { applicantId: '', vacancyId: '' };
  myCvs = signal<any[]>([]);
  selectedCvId = signal<string | null>(null);
  loading = signal(false);

  private applicantService = inject(ApplicantService);
  private toast = inject(ToastService);
  // ----------------------------------------------------

  // CONSTRUCTOR GỐC (GIỮ NGUYÊN KHÔNG ĐỤNG CHẠM)
  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}

  // NGONINIT GỐC (CHỈ THÊM 2 DÒNG GỌI HÀM MỚI BÊN DƯỚI)
  ngOnInit(): void {
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
  }

  // HÀM GỐC CỦA TEAM (GIỮ NGUYÊN)
  getStatusClass(status: ApplicationStatus): string {
    const map: Record<string, string> = {
      [ApplicationStatus.PENDING]: 'badge-neutral',
      [ApplicationStatus.SCREENING]: 'badge-warning',
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 'badge-info',
      [ApplicationStatus.SELECTED]: 'badge-success',
      [ApplicationStatus.REJECTED]: 'badge-danger',
      [ApplicationStatus.NOT_REQUIRED]: 'badge-neutral',
    };
    return map[status] ?? 'badge-neutral';
  }

  // --- MÃ MỚI THÊM NẰM Ở ĐÂY XUỐNG DƯỚI ---
  loadSavedJobs() {
    const savedStr = localStorage.getItem('saved_jobs');
    if (savedStr) {
      this.savedJobs.set(JSON.parse(savedStr));
    }
  }

  unsaveJob(jobId: string) {
    let saved = this.savedJobs().filter(j => j.id !== jobId);
    this.savedJobs.set(saved);
    localStorage.setItem('saved_jobs', JSON.stringify(saved));
    this.toast.success('Removed from saved jobs');
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
