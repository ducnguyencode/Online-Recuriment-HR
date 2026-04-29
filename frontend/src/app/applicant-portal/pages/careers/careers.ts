import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacancyService } from '../../../core/services/vacancy.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationService, CreateApplicationDto } from '../../../core/services/application.service';
import { ToastService } from '../../../core/services/toast.service';
// import { ProfileService } from '../../../core/services/profile.service'; // Mở comment này khi có service lấy CV của user

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './careers.html',
})
export class CareersComponent implements OnInit {
  vacancies = signal<any[]>([]);
  loading = signal(false);
  searchQuery = '';

  isApplyModalOpen = false;
  selectedJobTitle = '';
  applyForm = { applicantId: '', vacancyId: '' };

  // Dùng API thật để chứa CV
  myCvs = signal<any[]>([]);
  selectedCvId = signal<string | null>(null);

  private router = inject(Router);
  private vacancyService = inject(VacancyService);
  private auth = inject(AuthService);
  private applicationService = inject(ApplicationService);
  private toast = inject(ToastService);
  // private profileService = inject(ProfileService);

  ngOnInit() {
    this.fetchJobs();
    this.fetchUserCvs();
  }

  fetchJobs() {
    this.loading.set(true);
    this.vacancyService.getAll({ search: this.searchQuery || undefined }).subscribe({
      next: (res: any) => { this.vacancies.set(res.data?.items ?? res.data ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load vacancies.'); this.loading.set(false); }
    });
  }

  fetchUserCvs() {
    if (this.auth.isLoggedIn()) {
      // GỌI API THẬT: this.profileService.getMyCvs().subscribe(res => this.myCvs.set(res.data));
    }
  }

  applyJob(vacancy: any) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.selectedJobTitle = vacancy.title;
      this.selectedCvId.set(null);
      this.applyForm = { applicantId: this.auth.currentUser()?.applicantId || '', vacancyId: vacancy.id };
      this.isApplyModalOpen = true;
    }
  }

  closeApplyModal() { this.isApplyModalOpen = false; }

  submitApplication() {
    if (!this.selectedCvId()) {
      this.toast.error('Please select a resume to apply!');
      return;
    }
    this.loading.set(true);
    const dto: CreateApplicationDto = { applicantId: this.applyForm.applicantId, vacancyId: this.applyForm.vacancyId, cvId: this.selectedCvId() as string };

    this.applicationService.create(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeApplyModal();
        this.toast.success('Applied successfully!');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Application failed.');
      }
    });
  }
}
