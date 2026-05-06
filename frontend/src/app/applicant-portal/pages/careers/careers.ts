import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacancyService } from '../../../core/services/vacancy.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ApplicationService,
  CreateApplicationDto,
} from '../../../core/services/application.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApplicantService } from '../../../core/services/applicant.service';

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

  // --- MÃ MỚI THÊM: QUẢN LÝ TIM (KHÔNG ĐỤNG CODE CŨ) ---
  savedJobIds = signal<string[]>([]);
  // ----------------------------------------------------

  private router = inject(Router);
  private vacancyService = inject(VacancyService);
  private applicationService = inject(ApplicationService);
  private toast = inject(ToastService);
  private applicantServce = inject(ApplicantService);

  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.fetchJobs();
    this.fetchUserCvs();
    this.loadSavedJobs(); // Chỉ thêm dòng này để load tim
  }

  // --- TỪ ĐÂY XUỐNG DƯỚI LÀ CODE GỐC CỦA TEAM KHÔNG ĐỔI ---
  fetchJobs() {
    this.loading.set(true);
    this.vacancyService
      .getAll({ search: this.searchQuery || undefined })
      .subscribe({
        next: (res: any) => {
          this.vacancies.set(res.data?.items ?? res.data ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load vacancies.');
          this.loading.set(false);
        },
      });
  }

  fetchUserCvs() {
    if (this.auth.isLoggedIn()) {
      this.applicantServce
        .findAllCvByApplicantId(this.auth.currentUser()?.applicantId || '')
        .subscribe((res) => this.myCvs.set(res.data));
    }
  }

  applyJob(vacancy: any) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.selectedJobTitle = vacancy.title;
      this.selectedCvId.set(null);
      this.applyForm = {
        applicantId: this.auth.currentUser()?.applicantId || '',
        vacancyId: vacancy.id,
      };
      this.isApplyModalOpen = true;
    }
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
    const dto: CreateApplicationDto = {
      applicantId: this.applyForm.applicantId,
      vacancyId: this.applyForm.vacancyId,
      cvId: this.selectedCvId() as string,
    };

    this.applicationService.applicantCreate(dto).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeApplyModal();
        this.toast.success('Applied successfully!');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Application failed.');
      },
    });
  }

  // --- MÃ MỚI THÊM: LOGIC TIM VIỆC LÀM (LOCAL STORAGE) ---
  loadSavedJobs() {
    const saved = localStorage.getItem('saved_jobs');
    if (saved) {
      this.savedJobIds.set(JSON.parse(saved).map((j: any) => j.id));
    }
  }

  isJobSaved(id: string): boolean {
    return this.savedJobIds().includes(id);
  }

  toggleSaveJob(job: any) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    let saved = [];
    const savedStr = localStorage.getItem('saved_jobs');
    if (savedStr) saved = JSON.parse(savedStr);

    const index = saved.findIndex((j: any) => j.id === job.id);
    if (index > -1) {
      saved.splice(index, 1);
      this.toast.success('Removed from saved jobs!');
    } else {
      saved.push(job);
      this.toast.success('Job saved to your Dashboard!');
    }

    localStorage.setItem('saved_jobs', JSON.stringify(saved));
    this.savedJobIds.set(saved.map((j: any) => j.id));
  }
}
