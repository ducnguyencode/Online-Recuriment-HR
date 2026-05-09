import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { VacancyService } from '../../../core/services/vacancy.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  ApplicationService,
  CreateApplicationDto,
} from '../../../core/services/application.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApplicantService } from '../../../core/services/applicant.service';
import { FavoriteJobService } from '../../../core/services/favorite-job.service';
import { VacancyStatus } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './careers.html',
})
export class CareersComponent implements OnInit, OnDestroy {
  // --- EXISTING DATA SIGNALS ---
  vacancies = signal<any[]>([]);
  loading = signal(false);
  searchQuery = '';
  selectedDepartmentId = '';

  // --- PAGINATION ---
  currentPage = signal(1);
  totalPages = signal(1);
  totalItems = signal(0);
  readonly pageSize = 10;

  // --- EXTRACTED DEPARTMENTS ---
  departments = signal<{ id: string; name: string }[]>([]);

  // --- APPLY MODAL STATE ---
  isApplyModalOpen = false;
  selectedJobTitle = '';
  applyForm = { applicantId: '', vacancyId: '' };

  // --- JOB DETAIL MODAL STATE (NEW) ---
  isDetailModalOpen = false;
  selectedJob: any = null;

  myCvs = signal<any[]>([]);
  selectedCvId = signal<string | null>(null);
  uploadingCv = signal(false);
  savedJobIds = signal<string[]>([]);

  private router = inject(Router);
  private vacancyService = inject(VacancyService);
  private auth = inject(AuthService);
  private applicationService = inject(ApplicationService);
  private toast = inject(ToastService);
  private applicantServce = inject(ApplicantService);
  private favoriteJobService = inject(FavoriteJobService);

  private searchSubject$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.fetchJobs();
    this.fetchUserCvs();
    this.loadSavedJobs();

    // Realtime search with 300ms debounce
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.fetchJobs());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput() {
    this.currentPage.set(1);
    this.searchSubject$.next(this.searchQuery);
  }

  // --- ORIGINAL FUNCTIONS (KEEP UNCHANGED) ---
  fetchJobs() {
    this.loading.set(true);
    this.vacancyService
      .getAll({
        search: this.searchQuery || undefined,
        status: VacancyStatus.OPENED,
        departmentId: this.selectedDepartmentId || undefined,
        page: this.currentPage(),
        limit: this.pageSize,
      })
      .subscribe({
        next: (res: any) => {
          const items = res.data?.items ?? res.data ?? [];
          this.vacancies.set(items);
          this.totalPages.set(res.data?.totalPages ?? res.data?.totalPage ?? 1);
          this.totalItems.set(res.data?.total ?? items.length);
          // Only extract departments from unfiltered results
          if (!this.searchQuery && !this.selectedDepartmentId) {
            this.extractDepartments(items);
          }
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Failed to load vacancies.');
          this.loading.set(false);
        },
      });
  }

  extractDepartments(vacancies: any[]) {
    const seen = new Set<string>();
    const depts: { id: string; name: string }[] = [];
    for (const v of vacancies) {
      if (v.department?.id && !seen.has(v.department.id)) {
        seen.add(v.department.id);
        depts.push({ id: v.department.id, name: v.department.name });
      }
    }
    this.departments.set(depts);
  }

  onDepartmentChange(value: string) {
    this.selectedDepartmentId = value;
    this.currentPage.set(1);
    this.fetchJobs();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedDepartmentId = '';
    this.currentPage.set(1);
    this.fetchJobs();
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.fetchJobs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const maxVisible = 7;
    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      let start = Math.max(1, current - 3);
      let end = Math.min(total, current + 3);
      if (start <= 2) end = Math.min(start + 6, total);
      if (end >= total - 1) start = Math.max(1, end - 6);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  }

  fetchUserCvs() {
    if (this.auth.isLoggedIn()) {
      this.applicantServce
        .findAllCvByApplicantId(this.auth.currentUser()?.applicantId || '')
        .subscribe((res) => this.myCvs.set(res.data));
    }
  }

  onCvFileSelected(event: Event, inputEl: HTMLInputElement) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'applicantId',
      this.auth.currentUser()?.applicantId || '',
    );
    this.uploadingCv.set(true);

    this.applicantServce.uploadCv(formData).subscribe({
      next: (res: any) => {
        this.uploadingCv.set(false);
        this.toast.success('CV uploaded successfully!');
        this.fetchUserCvs();
        if (res.data?.id) {
          this.selectedCvId.set(res.data.id);
        }
        input.value = '';
      },
      error: (err: any) => {
        this.uploadingCv.set(false);
        this.toast.error(err.error?.message || 'Upload failed.');
        input.value = '';
      },
    });
  }

  onCvDrop(event: DragEvent, inputEl: HTMLInputElement) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(files[0]);
    inputEl.files = dataTransfer.files;
    this.onCvFileSelected({ target: inputEl } as any, inputEl);
  }

  openCV(url: string) {
    window.open(`${environment.baseUrl}/uploads/${url}`);
  }

  deleteCv(id: string) {
    this.applicantServce.deleteCv(id).subscribe({
      next: (res) => {
        this.fetchUserCvs();
        if (this.selectedCvId() === id) {
          this.selectedCvId.set(null);
        }
        this.toast.success(res.data);
      },
      error: (err) => this.toast.error(err.error.message),
    });
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

  // --- NEW DETAIL MODAL FUNCTIONS ---
  viewJobDetail(job: any) {
    this.selectedJob = job;
    this.isDetailModalOpen = true;
  }

  closeDetailModal() {
    this.isDetailModalOpen = false;
    this.selectedJob = null;
  }

  // --- REMAINING UTILITIES ---
  closeApplyModal() {
    this.isApplyModalOpen = false;
  }

  submitApplication() {
    if (!this.selectedCvId()) {
      if (this.myCvs().length === 0) {
        this.toast.error('You haven\'t uploaded a CV yet. Please upload one to apply.');
      } else {
        this.toast.error('Please select a resume to apply!');
      }
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

  loadSavedJobs() {
    this.favoriteJobService.getSavedIds().subscribe({
      next: (ids) => this.savedJobIds.set(ids),
    });
  }

  isJobSaved(id: string): boolean {
    return this.savedJobIds().includes(String(id));
  }

  toggleSaveJob(job: any) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    const vacancyId = String(job.id);
    const wasSaved = this.savedJobIds().includes(vacancyId);

    // Optimistic UI update – heart reacts instantly
    if (wasSaved) {
      this.savedJobIds.update((ids) => ids.filter((id) => id !== vacancyId));
    } else {
      this.savedJobIds.update((ids) => [...ids, vacancyId]);
    }

    this.favoriteJobService.toggle(vacancyId).subscribe({
      next: (res) => {
        // Sync with server truth
        if (res.data?.saved) {
          this.savedJobIds.update((ids) => {
            if (!ids.includes(vacancyId)) return [...ids, vacancyId];
            return ids;
          });
          this.toast.success('Job saved to your Dashboard!');
        } else {
          this.savedJobIds.update((ids) => ids.filter((id) => id !== vacancyId));
          this.toast.success('Removed from saved jobs!');
        }
      },
      error: () => {
        // Revert optimistic update on failure
        if (wasSaved) {
          this.savedJobIds.update((ids) => [...ids, vacancyId]);
        } else {
          this.savedJobIds.update((ids) => ids.filter((id) => id !== vacancyId));
        }
        this.toast.error('Failed to update saved jobs.');
      },
    });
  }
}
