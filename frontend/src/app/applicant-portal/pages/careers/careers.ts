import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VacancyService } from '../../../core/services/vacancy.service';
import { Vacancy, VacancyStatus } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { ApplicantService } from '../../../core/services/applicant.service';
import {
  ApplicationService,
  CreateApplicationDto,
} from '../../../core/services/application.service';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './careers.html',
  styleUrls: ['./careers.scss'],
})
export class CareersComponent implements OnInit {
  // --- SIGNALS ---
  vacancies = signal<Vacancy[]>([]);
  loading = signal(false);
  errorMsg = signal('');

  // --- FILTERS ---
  searchQuery = '';
  filterStatus: VacancyStatus = VacancyStatus.OPENED;
  filterDepartment = '';

  // --- MODAL & FORM ---
  isApplyModalOpen = false;
  selectedJobTitle = '';
  applyForm = { applicantId: '', fullName: '', email: '', vacancyId: '' };

  // Quản lý File CV bằng Signal để UI cập nhật ngay lập tức
  cvUploadFile = signal<File | null>(null);
  // Computed để hiển thị tên file ngoài HTML (Fix lỗi chị Vũ nhắc)
  selectedFileName = computed(() => this.cvUploadFile()?.name || '');

  private router = inject(Router);
  private vacancyService = inject(VacancyService);
  private auth = inject(AuthService);
  private applicantService = inject(ApplicantService);
  private applicationService = inject(ApplicationService);

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.vacancyService
      .getAll({
        status: this.filterStatus || VacancyStatus.OPENED,
        departmentId: this.filterDepartment || undefined,
        search: this.searchQuery || undefined,
      })
      .subscribe({
        next: (res) => {
          const items = (res.data as any)?.items ?? res.data ?? [];
          this.vacancies.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMsg.set(err.error?.message || 'Failed to fetch jobs');
          this.loading.set(false);
        },
      });
  }

  toggleFavorite(job: any) {
    job.isFavorite = !job.isFavorite;
  }

  // THAY ALERT BẰNG LOGIC KHÁC (HOẶC ĐIỀU HƯỚNG) THEO Ý CHỊ VŨ
  viewDetails(job: any) {
    console.log('Navigating to details for:', job.title);
    // Ví dụ: điều hướng sang trang chi tiết thay vì alert
    // this.router.navigate(['/careers', job.id]);
  }

  applyJob(vacancy: Vacancy) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.selectedJobTitle = vacancy.title;
      this.isApplyModalOpen = true;
      this.applyForm = {
        fullName: this.auth.currentUser()?.fullName || '',
        applicantId: this.auth.currentUser()?.applicantId || '',
        vacancyId: vacancy.id,
        email: this.auth.currentUser()?.email || '',
      };
      document.body.style.overflow = 'hidden';
    }
  }

  closeApplyModal() {
    this.isApplyModalOpen = false;
    this.applyForm = { applicantId: '', fullName: '', email: '', vacancyId: '' };
    this.cvUploadFile.set(null); // Reset file signal
    document.body.style.overflow = 'auto';
  }

  // FIX: Cập nhật signal khi chọn file
  selectCvFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.cvUploadFile.set(file);
    }
  }

  submitApplication() {
    if (!this.cvUploadFile()) {
      this.errorMsg.set('Please upload your CV first!');
      return;
    }

    this.loading.set(true);
    const formData = new FormData();
    formData.append('applicantId', this.applyForm.applicantId);
    formData.append('file', this.cvUploadFile() as File);

    this.applicantService.uploadCv(formData).subscribe({
      next: (res) => {
        if (res.data) {
          const dto: CreateApplicationDto = {
            applicantId: this.applyForm.applicantId,
            vacancyId: this.applyForm.vacancyId,
            cvId: res.data.id,
          };
          this.applicationService.create(dto).subscribe({
            next: (res) => {
              this.loading.set(false);
              this.closeApplyModal();
              // Ở đây có thể điều hướng hoặc hiện Toast thành công
            },
            error: (err) => {
              this.loading.set(false);
              this.errorMsg.set('Failed to submit application');
            },
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set('Failed to upload CV');
      },
    });
  }
}
