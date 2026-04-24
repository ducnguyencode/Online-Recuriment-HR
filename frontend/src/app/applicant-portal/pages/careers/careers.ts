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
  vacancies = signal<Vacancy[]>([]);
  loading = signal(false);
  errorMsg = signal('');
  applyError = signal(''); // Biến riêng để hiện lỗi trong Modal

  searchQuery = '';
  filterStatus: VacancyStatus = VacancyStatus.OPENED;
  filterDepartment = '';

  isApplyModalOpen = false;
  selectedJobTitle = '';
  applyForm = { applicantId: '', fullName: '', email: '', vacancyId: '' };

  cvUploadFile = signal<File | null>(null);
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

  viewDetails(job: any) {
    console.log('Navigating to details for:', job.title);
  }

  applyJob(vacancy: Vacancy) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.selectedJobTitle = vacancy.title;
      this.isApplyModalOpen = true;
      this.applyError.set(''); // Reset lỗi modal khi mở
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
    this.applyError.set('');
    this.applyForm = { applicantId: '', fullName: '', email: '', vacancyId: '' };
    this.cvUploadFile.set(null);
    document.body.style.overflow = 'auto';
  }

  selectCvFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.cvUploadFile.set(file);
      this.applyError.set(''); // Xóa lỗi khi người dùng chọn lại file
    }
  }

  submitApplication() {
    if (!this.cvUploadFile()) {
      this.applyError.set('Please upload your CV first!');
      return;
    }

    if (!this.applyForm.applicantId) {
      this.applyError.set(
        'Your applicant profile is not ready yet. Please sign out and sign in again, or contact support.',
      );
      return;
    }

    this.loading.set(true);
    const formData = new FormData();
    formData.append('applicantId', String(this.applyForm.applicantId));
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
            },
            error: (err) => {
              this.loading.set(false);
              // HIỆN LỖI TRONG MODAL: "Applicant already applied..."
              this.applyError.set(err.error?.message || 'Failed to submit application');
            },
          });
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.applyError.set('Failed to upload CV');
      },
    });
  }
}
