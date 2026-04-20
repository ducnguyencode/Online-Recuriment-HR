import { Component, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import {
  VacancyService,
  CreateVacancyDto,
} from '../../../core/services/vacancy.service';
import { ApplicationService } from '../../../core/services/application.service';
import { DepartmentService } from '../../../core/services/department.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import {
  Application,
  Vacancy,
  Department,
  VacancyStatus,
  canChangeVacancyStatus,
  formatDisplayId,
  isVacancyClosedStatus,
  isVacancyOpenStatus,
  isVacancyOwner,
} from '../../../core/models';

@Component({
  selector: 'app-vacancy-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './vacancy-list.component.html',
  styleUrl: './vacancy-list.component.scss',
})
export class VacancyListComponent implements OnInit {
  vacancies = signal<Vacancy[]>([]);
  departments = signal<Department[]>([]);
  loading = signal(false);
  errorMsg = signal('');
  totalItems = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  readonly pageSize = 12;
  selectedApplicants = signal<Application[]>([]);
  selectedApplicantsLoading = signal(false);

  // View mode: table | card
  viewMode: 'table' | 'card' = 'table';

  // Filters
  searchQuery = '';
  filterStatus = '';
  filterDepartment = '';

  // Dialogs
  showFormDialog = signal(false);
  showDetailDialog = signal(false);
  isEditing = signal(false);
  selectedVacancy = signal<Vacancy | null>(null);

  formData: CreateVacancyDto = {
    title: '',
    description: '',
    departmentId: '',
    numberOfOpenings: 1,
    closingDate: '',
  };

  formError = '';
  departmentFormError = '';

  // Expanded description editor
  showExpandedEditor = signal(false);
  @ViewChild('editorEl') editorEl?: ElementRef<HTMLDivElement>;
  private savedRange: Range | null = null;

  // Add dept inline
  showDeptDialog = signal(false);
  newDeptName = '';

  constructor(
    private auth: AuthService,
    private vacancyService: VacancyService,
    private applicationService: ApplicationService,
    private departmentService: DepartmentService,
    private mockData: MockDataService, // fallback when backend not ready
  ) {}

  ngOnInit() {
    this.loadDepartments();
    this.loadVacancies();
  }

  get currentUserId(): string {
    return this.auth.currentUser()?.employeeId ?? '';
  }

  // ── Business rule helpers ────────────────────────────────────────────────

  isOwner(v: Vacancy): boolean {
    return isVacancyOwner(v, this.currentUserId);
  }

  hasOwnerData(v: Vacancy): boolean {
    return !!(v.ownedByEmployeeId || v.owner?.fullName);
  }

  canEdit(v: Vacancy): boolean {
    return (
      this.hasOwnerData(v) &&
      isVacancyOwner(v, this.currentUserId) &&
      !isVacancyClosedStatus(v.status)
    );
  }

  canChangeStatus(v: Vacancy): boolean {
    return (
      this.hasOwnerData(v) &&
      isVacancyOwner(v, this.currentUserId) && canChangeVacancyStatus(v.status)
    );
  }

  editTitle(v: Vacancy): string {
    if (!this.hasOwnerData(v)) return 'Owner data is unavailable';
    if (isVacancyClosedStatus(v.status)) return 'Cannot edit a closed vacancy';
    if (!this.isOwner(v)) return 'Only the vacancy owner can edit';
    return 'Edit vacancy';
  }

  /** Per spec: Opened → Closed | Suspended. Suspended → Opened | Closed. Closed → nothing */
  allowedStatuses(v: Vacancy): VacancyStatus[] {
    if (isVacancyOpenStatus(v.status)) return ['Suspended', 'Closed'];
    if (v.status === 'Suspended') return ['Opened', 'Closed'];
    return [];
  }

  getProgressPercent(v: Vacancy): number {
    return v.numberOfOpenings > 0
      ? Math.min(100, Math.round((v.filledCount / v.numberOfOpenings) * 100))
      : 0;
  }

  isNearDeadline(v: Vacancy): boolean {
    if (!v.closingDate) return false;
    const days = (new Date(v.closingDate).getTime() - Date.now()) / 86400000;
    return days >= 0 && days <= 7;
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  loadDepartments() {
    // Try real API first, fall back to mock
    this.departmentService.getAll().subscribe({
      next: (res) =>
        this.departments.set(Array.isArray(res.data) ? res.data : []),
      error: () =>
        this.departments.set(
          this.mockData
            .getDepartments()
            .map((d) => ({ ...d, id: String(d.id) })),
        ),
    });
  }

  loadVacancies() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.vacancyService
      .getAll({
        status: this.filterStatus || undefined,
        departmentId: this.filterDepartment || undefined,
        search: this.useBackendSearch() ? this.searchQuery : undefined,
        page: this.currentPage(),
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          const items = (res.data as any)?.items ?? res.data ?? [];
          const totalItems =
            (res.data as any)?.totalItems ??
            (res.data as any)?.total ??
            items.length;
          const totalPages =
            (res.data as any)?.totalPage ??
            (res.data as any)?.totalPages ??
            Math.max(1, Math.ceil(totalItems / this.pageSize));
          this.vacancies.set(items);
          this.totalItems.set(totalItems);
          this.totalPages.set(totalPages);
          this.loading.set(false);
        },
        error: () => {
          // Fallback to mock while backend is being built
          const raw = this.applyLocalSearch(
            this.mockData.getVacancies({
            status: this.filterStatus || undefined,
            search: this.searchQuery || undefined,
            departmentId: this.filterDepartment || undefined,
            }),
          );
          const start = (this.currentPage() - 1) * this.pageSize;
          this.vacancies.set(
            raw.map((v) => ({
              ...v,
              id: String(v.id),
              departmentId: String(v.departmentId),
              ownedByEmployeeId: String(v.ownedByEmployeeId),
              numberOfOpenings: (v as any).openings ?? v.numberOfOpenings ?? 1,
              closingDate: (v as any).deadline ?? v.closingDate ?? '',
            })).slice(start, start + this.pageSize) as any,
          );
          this.totalItems.set(raw.length);
          this.totalPages.set(Math.max(1, Math.ceil(raw.length / this.pageSize)));
          this.loading.set(false);
        },
      });
  }

  visibleVacancies(): Vacancy[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.vacancies();
    return this.vacancies().filter((vacancy) => {
      const values = [
        vacancy.code,
        vacancy.title,
        vacancy.description,
        vacancy.department?.name,
      ];
      return values.some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      );
    });
  }

  onSearch() {
    this.currentPage.set(1);
    this.loadVacancies();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDepartment = '';
    this.currentPage.set(1);
    this.loadVacancies();
  }

  goToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
    this.loadVacancies();
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  openCreateDialog() {
    this.isEditing.set(false);
    this.formData = {
      title: '',
      description: '',
      departmentId: '',
      numberOfOpenings: 1,
      closingDate: '',
    };
    this.formError = '';
    this.showFormDialog.set(true);
  }

  openEditDialog(v: Vacancy, event: Event) {
    event.stopPropagation();
    if (!this.canEdit(v)) return;
    this.isEditing.set(true);
    this.selectedVacancy.set(v);
    this.formData = {
      title: v.title,
      description: v.description,
      departmentId: v.departmentId,
      numberOfOpenings: v.numberOfOpenings,
      closingDate: v.closingDate ? v.closingDate.split('T')[0] : '',
    };
    this.formError = '';
    this.showFormDialog.set(true);
  }

  openDetail(v: Vacancy) {
    this.selectedVacancy.set(v);
    this.loadSelectedApplicants(v.id);
    this.showDetailDialog.set(true);
  }

  closeDialogs() {
    this.showFormDialog.set(false);
    this.showDetailDialog.set(false);
    this.selectedVacancy.set(null);
    this.selectedApplicants.set([]);
    this.selectedApplicantsLoading.set(false);
    this.formError = '';
  }

  saveVacancy() {
    if (
      !this.formData.title.trim() ||
      !this.formData.description.trim() ||
      !this.formData.departmentId
    ) {
      this.formError = 'Title, description and department are required.';
      return;
    }
    if (this.formData.numberOfOpenings < 1) {
      this.formError = 'Number of openings must be at least 1.';
      return;
    }

    const dto: CreateVacancyDto = {
      ...this.formData,
      closingDate: this.formData.closingDate
        ? new Date(this.formData.closingDate).toISOString()
        : null,
    };

    if (this.isEditing() && this.selectedVacancy()) {
      this.vacancyService.update(this.selectedVacancy()!.id, dto).subscribe({
        next: () => {
          this.closeDialogs();
          this.loadVacancies();
        },
        error: () => {
          // Mock fallback
          this.mockData.updateVacancy(this.selectedVacancy()!.id, {
            title: dto.title,
            description: dto.description,
            numberOfOpenings: dto.numberOfOpenings,
            closingDate: dto.closingDate,
          });
          this.closeDialogs();
          this.loadVacancies();
        },
      });
    } else {
      this.vacancyService.create(dto).subscribe({
        next: () => {
          this.closeDialogs();
          this.loadVacancies();
        },
        error: (err) => {
          this.formError = err.error.message;

          // this.mockData.addVacancy({
          //   title: dto.title,
          //   description: dto.description,
          //   departmentId: dto.departmentId,
          //   numberOfOpenings: dto.numberOfOpenings,
          //   closingDate: dto.closingDate,
          // });
          // this.closeDialogs();
          // this.loadVacancies();
        },
      });
    }
  }

  changeStatus(v: Vacancy, status: VacancyStatus, event: Event) {
    event.stopPropagation();
    if (!this.canChangeStatus(v)) return;

    this.vacancyService.changeStatus(v.id, status).subscribe({
      next: () => this.loadVacancies(),
      error: () => {
        this.mockData.updateVacancyStatus(v.id, status);
        this.loadVacancies();
      },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Open: 'badge-success',
      Opened: 'badge-success',
      Suspended: 'badge-warning',
      Close: 'badge-danger',
      Closed: 'badge-danger',
    };
    return map[status] ?? 'badge-neutral';
  }

  ownerDisplay(v: Vacancy): string {
    return v.owner?.fullName ?? 'Unavailable';
  }

  applicantDisplayId(id?: string) {
    return formatDisplayId('A', id);
  }

  isOpenStatus(status?: string) {
    return isVacancyOpenStatus(status);
  }

  isClosedStatus(status?: string) {
    return isVacancyClosedStatus(status);
  }

  displayedResultsCount(): number {
    if (this.searchQuery.trim() && !this.useBackendSearch()) {
      return this.visibleVacancies().length;
    }
    return this.totalItems();
  }

  private useBackendSearch(): boolean {
    const query = this.searchQuery.trim();
    if (!query) return false;
    return !/^v\d+/i.test(query);
  }

  private applyLocalSearch(vacancies: Vacancy[]): Vacancy[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return vacancies;
    return vacancies.filter((vacancy) => {
      const values = [
        vacancy.code,
        vacancy.title,
        vacancy.description,
        vacancy.department?.name,
      ];
      return values.some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      );
    });
  }

  private loadSelectedApplicants(vacancyId: string) {
    this.selectedApplicantsLoading.set(true);
    this.applicationService
      .getAll({ vacancyId, status: 'Selected', page: 1, limit: 50 })
      .subscribe({
        next: (res) => {
          const items = ((res.data as any)?.items ?? []) as Application[];
          this.selectedApplicants.set(items);
          this.selectedApplicantsLoading.set(false);
        },
        error: () => {
          const items = this.mockData
            .getApplications({ vacancyId, status: 'Selected' })
            .map((item) => ({
              ...item,
              id: String(item.id),
              applicantId: String(item.applicantId),
              vacancyId: String(item.vacancyId),
            })) as Application[];
          this.selectedApplicants.set(items);
          this.selectedApplicantsLoading.set(false);
        },
      });
  }

  // ── Expanded description editor ─────────────────────────────────────────

  openExpandedEditor() {
    this.savedRange = null;
    this.showExpandedEditor.set(true);
    setTimeout(() => {
      if (this.editorEl) {
        this.editorEl.nativeElement.innerHTML = this.formData.description || '';
        this.editorEl.nativeElement.focus();
      }
    }, 50);
  }

  closeExpandedEditor() {
    this.savedRange = null;
    this.showExpandedEditor.set(false);
  }

  applyExpandedContent() {
    if (this.editorEl) {
      this.formData = { ...this.formData, description: this.editorEl.nativeElement.innerHTML };
    }
    this.closeExpandedEditor();
  }

  onEditorBlur() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  execCommand(command: string, value?: string) {
    const editor = this.editorEl?.nativeElement;
    if (!editor) return;

    editor.focus();

    if (this.savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
      }
    }

    document.execCommand(command, false, value ?? undefined);

    // Save updated selection after command
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  // ── Department quick-add ──────────────────────────────────────────────────

  openDeptDialog() {
    this.newDeptName = '';
    this.showDeptDialog.set(true);
  }
  closeDeptDialog() {
    this.showDeptDialog.set(false);
    this.departmentFormError = '';
  }

  saveDepartment() {
    if (!this.newDeptName.trim()) return;
    this.departmentService.create(this.newDeptName.trim()).subscribe({
      next: (res) => {
        this.departments.update((d) => [...d, res.data]);
        this.formData.departmentId = res.data.id;
        this.closeDeptDialog();
      },
      error: (err) => {
        this.departmentFormError = err.error.message;

        // const d = this.mockData.addDepartment(this.newDeptName.trim());
        // this.departments.update((list) => [
        //   ...list,
        //   { ...d, id: String(d.id) },
        // ]);
        // this.formData.departmentId = String(d.id);
        // this.closeDeptDialog();
      },
    });
  }
}
