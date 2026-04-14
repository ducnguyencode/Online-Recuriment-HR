import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ApplicantService,
  CreateApplicantDto,
} from '../../../core/services/applicant.service';
import { ApplicationService } from '../../../core/services/application.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import {
  Applicant,
  Application,
  CV,
  formatDisplayId,
} from '../../../core/models';

enum ApplicantStatus {
  NOT_IN_PROCESS = 'Not In Process',
  IN_PROCESS = 'In Process',
  HIRED = 'Hired',
  BANNED = 'Banned',
}

@Component({
  selector: 'app-applicant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './applicant-list.component.html',
  styleUrl: './applicant-list.component.scss',
})
export class ApplicantListComponent implements OnInit {
  applicantStatus = Object.values(ApplicantStatus);
  applicants = signal<Applicant[]>([]);
  loading = signal(false);

  searchQuery = '';
  filterStatus = '';

  currentPage = signal(1);
  readonly pageSize = 20;

  showDetail = signal(false);
  selectedApplicant = signal<Applicant | null>(null);
  selectedHistory = signal<Application[]>([]);
  selectedCv = signal<CV | null>(null);

  showFormDialog = signal(false);
  isEditing = signal(false);
  formData: CreateApplicantDto = { fullName: '', email: '', phone: '' };
  formError = '';

  constructor(
    private applicantService: ApplicantService,
    private applicationService: ApplicationService,
    private mockData: MockDataService,
  ) {}

  ngOnInit() {
    this.loadApplicants();
  }

  loadApplicants() {
    this.loading.set(true);
    this.applicantService
      .getAll({
        status: this.filterStatus || undefined,
        search: this.searchQuery || undefined,
      })
      .subscribe({
        next: (res) => {
          const items: Applicant[] = (res.data as any)?.items ?? [];
          this.applicants.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.applicants.set(
            this.mockData.getApplicants({
              status: this.filterStatus || undefined,
              search: this.searchQuery || undefined,
            }),
          );
          this.loading.set(false);
        },
      });
  }

  filteredApplicants(): Applicant[] {
    return this.applicants();
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredApplicants().length / this.pageSize),
    );
  }

  pagedApplicants(): Applicant[] {
    const all = this.filteredApplicants();
    const start = (this.currentPage() - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages)));
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.currentPage.set(1);
    this.loadApplicants();
  }

  openCreateDialog() {
    this.isEditing.set(false);
    this.formData = { fullName: '', email: '', phone: '' };
    this.formError = '';
    this.showFormDialog.set(true);
  }

  openEditDialog(applicant: Applicant, event: Event) {
    event.stopPropagation();
    this.isEditing.set(true);
    this.selectedApplicant.set(applicant);
    this.formData = {
      fullName: applicant.fullName,
      email: applicant.email,
      phone: applicant.phone,
    };
    this.formError = '';
    this.showFormDialog.set(true);
  }

  closeFormDialog() {
    this.showFormDialog.set(false);
    this.formError = '';
  }

  saveApplicant() {
    if (!this.formData.fullName.trim() || !this.formData.email.trim()) {
      this.formError = 'Full name and email are required.';
      return;
    }

    if (this.isEditing() && this.selectedApplicant()) {
      this.applicantService
        .update(this.selectedApplicant()!.id, this.formData)
        .subscribe({
          next: () => {
            this.closeFormDialog();
            this.loadApplicants();
          },
          error: () => {
            this.mockData.updateApplicant(
              this.selectedApplicant()!.id,
              this.formData as Partial<Applicant>,
            );
            this.closeFormDialog();
            this.loadApplicants();
          },
        });
      return;
    }

    this.applicantService.create(this.formData).subscribe({
      next: () => {
        this.closeFormDialog();
        this.loadApplicants();
      },
      error: (err) => {
        console.log(err);
        this.formError = err.error.message;
        // this.mockData.addApplicant(this.formData);
        // this.closeFormDialog();
        // this.loadApplicants();
      },
    });
  }

  changeStatus(
    applicant: Applicant,
    status: Applicant['status'],
    event: Event,
  ) {
    event.stopPropagation();
    this.applicantService.changeStatus(applicant.id, status).subscribe({
      next: () => this.loadApplicants(),
      error: () => {
        this.mockData.updateApplicantStatus(applicant.id, status);
        this.loadApplicants();
      },
    });
  }

  openDetail(applicant: Applicant) {
    this.selectedApplicant.set(applicant);
    this.selectedCv.set(null);
    this.selectedHistory.set([]);
    this.showDetail.set(true);

    this.applicationService
      .getAll({ applicantId: applicant.id, limit: 50 })
      .subscribe({
        next: (res) => {
          const items: Application[] = (res.data as any)?.items ?? [];
          this.selectedHistory.set(items);
          this.selectedCv.set(items.find((item) => item.cv)?.cv ?? null);
        },
        error: () => {
          const items = this.mockData
            .getApplications()
            .filter((item) => item.applicantId === applicant.id);
          this.selectedHistory.set(items);
          this.selectedCv.set(
            this.mockData.getCvByApplicantId(applicant.id) ?? null,
          );
        },
      });
  }

  closeDetail() {
    this.showDetail.set(false);
    this.selectedApplicant.set(null);
    this.selectedHistory.set([]);
    this.selectedCv.set(null);
  }

  getApplicantApplicationsCount(applicantId: string): number {
    return this.mockData
      .getApplications()
      .filter((item) => item.applicantId === applicantId).length;
  }

  getLatestVacancyTitle(applicantId: string): string {
    const latest = this.mockData
      .getApplications()
      .find((item) => item.applicantId === applicantId);
    return latest?.vacancy?.title ?? 'No vacancy attached';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Not in Process': 'badge-neutral',
      'In Process': 'badge-info',
      Hired: 'badge-success',
      Banned: 'badge-danger',
    };
    return map[status] ?? 'badge-neutral';
  }

  getApplicationStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pending: 'badge-neutral',
      Screening: 'badge-warning',
      'Interview Scheduled': 'badge-info',
      Selected: 'badge-success',
      Rejected: 'badge-danger',
      'Not Required': 'badge-neutral',
    };
    return map[status] ?? 'badge-neutral';
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  applicantDisplayId(id: string) {
    return formatDisplayId('A', id);
  }

  vacancyDisplayId(id: string) {
    return formatDisplayId('V', id);
  }
}
