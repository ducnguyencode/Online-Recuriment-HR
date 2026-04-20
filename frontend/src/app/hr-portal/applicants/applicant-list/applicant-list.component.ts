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
  displayApplicantStatus,
  formatDisplayId,
} from '../../../core/models';

@Component({
  selector: 'app-applicant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './applicant-list.component.html',
  styleUrl: './applicant-list.component.scss',
})
export class ApplicantListComponent implements OnInit {
  applicantStatus: Applicant['status'][] = [
    'Not In Process',
    'In Process',
    'Hired',
    'Banned',
  ];
  applicants = signal<Applicant[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  totalPages = signal(1);

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
        search: this.useBackendSearch() ? this.searchQuery : undefined,
        page: this.currentPage(),
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          const items: Applicant[] = (res.data as any)?.items ?? [];
          const totalItems =
            (res.data as any)?.totalItems ??
            (res.data as any)?.total ??
            items.length;
          const totalPages =
            (res.data as any)?.totalPage ??
            (res.data as any)?.totalPages ??
            Math.max(1, Math.ceil(totalItems / this.pageSize));
          this.applicants.set(items);
          this.totalItems.set(totalItems);
          this.totalPages.set(totalPages);
          this.loading.set(false);
        },
        error: () => {
          const all = this.applyLocalSearch(
            this.mockData.getApplicants({
              status: this.filterStatus || undefined,
            }),
          );
          const start = (this.currentPage() - 1) * this.pageSize;
          this.applicants.set(all.slice(start, start + this.pageSize));
          this.totalItems.set(all.length);
          this.totalPages.set(Math.max(1, Math.ceil(all.length / this.pageSize)));
          this.loading.set(false);
        },
      });
  }

  pagedApplicants(): Applicant[] {
    return this.applicants();
  }

  goToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
    this.loadApplicants();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.currentPage.set(1);
    this.loadApplicants();
  }

  onSearchChange() {
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
    if (!this.formData.fullName.trim() || !this.formData.email.trim() || !this.formData.phone.trim()) {
      this.formError = 'Full name, email and phone are required.';
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
        this.formError = err?.error?.message ?? 'Cannot create applicant.';
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

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Not In Process': 'badge-neutral',
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

  applicationDisplayId(id?: string) {
    return formatDisplayId('R', id);
  }

  vacancyDisplayId(id: string) {
    return formatDisplayId('V', id);
  }

  displayStatus(status?: string) {
    return displayApplicantStatus(status);
  }

  private useBackendSearch(): boolean {
    const query = this.searchQuery.trim();
    if (!query) return false;
    return !/^a\d+/i.test(query);
  }

  private applyLocalSearch(applicants: Applicant[]): Applicant[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return applicants;
    return applicants.filter((applicant) => {
      const values = [applicant.code, applicant.id, applicant.fullName, applicant.email];
      return values.some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      );
    });
  }
}
