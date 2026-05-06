import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VacancyService } from '../../../core/services/vacancy.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApplicantService } from '../../../core/services/applicant.service';
import { AuthService } from '../../../core/services/auth.service';

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

  // Modal states
  isDetailModalOpen = false;
  selectedJobDetail: any = null;
  isApplyModalOpen = false;
  selectedJobTitle = '';

  myCvs = signal<any[]>([]);
  selectedCvId = signal<string | null>(null);

  private vacancyService = inject(VacancyService);
  private toast = inject(ToastService);
  private applicantService = inject(ApplicantService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.fetchJobs();
    this.fetchUserCvs();
  }

  fetchJobs() {
    this.loading.set(true);
    this.vacancyService.getAll({ search: this.searchQuery || undefined }).subscribe({
      next: (res: any) => {
        this.vacancies.set(res.data?.items ?? res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  fetchUserCvs() {
    const userId = this.authService.currentUser()?.applicantId;
    if (userId) {
      this.applicantService.findAllCvByApplicantId(userId).subscribe((res: any) => {
        if (res.data) this.myCvs.set(res.data);
      });
    }
  }

  viewJobDetail(job: any) {
    this.selectedJobDetail = job;
    this.isDetailModalOpen = true;
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
  }

  openApplyModal(job: any) {
    this.selectedJobTitle = job.title;
    this.isApplyModalOpen = true;
  }

  submitApplication() {
    if (!this.selectedCvId()) {
      this.toast.error('Please select a resume');
      return;
    }
    this.toast.success('Application submitted successfully!');
    this.isApplyModalOpen = false;
  }
}
