import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ApplicantService } from '../../../core/services/applicant.service';
import { ApplicationService } from '../../../core/services/application.service';
import {
  InterviewService,
  ScheduleInterviewDto,
} from '../../../core/services/interview.service';
import { VacancyService } from '../../../core/services/vacancy.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import {
  Applicant,
  Application,
  Department,
  Employee,
  Vacancy,
  canAttachToVacancy,
  canAttachVacancyToApplicant,
  formatDisplayId,
} from '../../../core/models';
import { environment } from '../../../../environments/environment';

enum ApplicationStatus {
  PENDING = 'Pending',
  SCREENING = 'Screening',
  INTERVIEW_SCHEDULED = 'Interview Scheduled',
  SELECTED = 'Selected',
  REJECTED = 'Rejected',
  NOT_REQUIRED = 'Not Required',
}

@Component({
  selector: 'app-LApplication-LList',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss',
})
export class ApplicationListComponent implements OnInit, OnDestroy {
  applicationStatus = Object.values(ApplicationStatus);
  applications = signal<Application[]>([]);
  vacancies = signal<Vacancy[]>([]);
  applicants = signal<Applicant[]>([]);
  availableInterviewers = signal<Employee[]>([]);
  interviewDepartments = signal<Department[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  totalPages = signal(1);
  attachSearching = signal(false);

  searchQuery = '';
  filterStatus = '';
  selectedVacancyId = '';

  // Pagination
  currentPage = signal(1);
  readonly pageSize = 20;

  // Attach dialog — applicant search
  attachSearchQuery = '';
  attachSearchResults = signal<Applicant[]>([]);
  attachSelectedApplicant = signal<Applicant | null>(null);
  attachDropdownOpen = signal(false);
  private attachSearchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Attach dialog — vacancy combobox
  vacancySearchQuery = '';
  vacancyDropdownOpen = signal(false);
  attachSelectedVacancy = signal<Vacancy | null>(null);

  showCVDetail = signal(false);
  selectedApplication = signal<Application | null>(null);
  interviewApplication = signal<Application | null>(null);

  showInterviewDialog = signal(false);
  selectedPanelIds: string[] = [];
  selectedInterviewDepartmentId = '';
  interviewData = {
    applicationId: '',
    title: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    platform: 'Google Meet' as 'Google Meet' | 'Zoom' | 'On-site',
  };
  interviewError = '';
  availabilityPreview = signal<
    Record<
      string,
      { availableDate: string; startTime: string; endTime: string }[]
    >
  >({});

  showAttachDialog = signal(false);
  attachData = { applicantId: '', vacancyId: '', cvId: '' };
  attachError = '';

  constructor(
    private applicantService: ApplicantService,
    private applicationService: ApplicationService,
    private interviewService: InterviewService,
    private vacancyService: VacancyService,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private mockData: MockDataService,
  ) { }

  ngOnInit() {
    this.loadInterviewDepartments();
    this.loadVacancies();
    this.loadApplications();

    this.attachSearchSubject
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => this.performApplicantSearch(q));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVacancies() {
    this.vacancyService
      .getAll({ status: 'Opened', page: 1, limit: 100 })
      .subscribe({
        next: (res) => {
          const items = (res.data as any)?.items ?? res.data ?? [];
          this.vacancies.set(items);
        },
        error: () => {
          const raw = this.mockData.getVacancies({ status: 'Opened' });
          this.vacancies.set(
            raw.map((v) => ({
              ...v,
              id: String(v.id),
              departmentId: String(v.departmentId),
              ownedByEmployeeId: String(v.ownedByEmployeeId),
              numberOfOpenings: (v as any).openings ?? v.numberOfOpenings ?? 1,
              closingDate: (v as any).deadline ?? v.closingDate ?? '',
            })) as unknown as Vacancy[],
          );
        },
      });
  }

  loadApplications() {
    this.loading.set(true);
    this.applicationService
      .getAll({
        status: this.filterStatus || undefined,
        vacancyId: this.selectedVacancyId || undefined,
        search: this.useBackendSearch() ? this.searchQuery : undefined,
        page: this.currentPage(),
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          const items: Application[] = (res.data as any)?.items ?? [];
          const totalItems =
            (res.data as any)?.totalItems ??
            (res.data as any)?.total ??
            items.length;
          const totalPages =
            (res.data as any)?.totalPage ??
            (res.data as any)?.totalPages ??
            Math.max(1, Math.ceil(totalItems / this.pageSize));
          this.applications.set(items);
          this.totalItems.set(totalItems);
          this.totalPages.set(totalPages);
          this.loading.set(false);
        },
        error: () => {
          let raw = this.mockData.getApplications({
            ...(this.filterStatus ? { status: this.filterStatus as any } : {}),
            ...(this.selectedVacancyId
              ? { vacancyId: this.selectedVacancyId }
              : {}),
          });
          raw = this.applyLocalSearch(raw);
          const start = (this.currentPage() - 1) * this.pageSize;
          const items = raw.map((a) => ({
            ...a,
            id: String(a.id),
            applicantId: String(a.applicantId),
            vacancyId: String(a.vacancyId),
          })) as unknown as Application[];
          this.applications.set(items.slice(start, start + this.pageSize));
          this.totalItems.set(items.length);
          this.totalPages.set(
            Math.max(1, Math.ceil(items.length / this.pageSize)),
          );
          this.loading.set(false);
        },
      });
  }

  visibleApplications(): Application[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.applications();
    return this.applications().filter((app) => {
      const values = [
        app.code,
        app.id,
        app.applicantId,
        app.vacancyId,
        app.applicant?.id,
        app.vacancy?.id,
        app.applicant?.code,
        app.vacancy?.code,
        app.applicant?.fullName,
        app.applicant?.email,
        app.vacancy?.title,
      ];
      return values.some((value) =>
        (value ?? '').toLowerCase().includes(query),
      );
    });
  }

  pagedApplications(): Application[] {
    return this.visibleApplications();
  }

  goToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
    this.loadApplications();
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadApplications();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.selectedVacancyId = '';
    this.currentPage.set(1);
    this.loadApplications();
  }

  openAttachDialog() {
    this.attachData = { applicantId: '', vacancyId: '', cvId: '' };
    this.attachError = '';
    this.attachSearchQuery = '';
    this.attachSearchResults.set([]);
    this.attachSelectedApplicant.set(null);
    this.attachSearching.set(false);
    this.attachDropdownOpen.set(false);
    this.vacancySearchQuery = '';
    this.vacancyDropdownOpen.set(false);
    this.attachSelectedVacancy.set(null);
    this.showAttachDialog.set(true);
  }

  closeAttachDialog() {
    this.showAttachDialog.set(false);
    this.attachError = '';
    this.attachSearchQuery = '';
    this.attachSearchResults.set([]);
    this.attachSelectedApplicant.set(null);
    this.attachSearching.set(false);
    this.attachDropdownOpen.set(false);
    this.vacancySearchQuery = '';
    this.vacancyDropdownOpen.set(false);
    this.attachSelectedVacancy.set(null);
  }

  onAttachSearch() {
    this.attachDropdownOpen.set(true);
    this.attachSearchSubject.next(this.attachSearchQuery);
  }

  onAttachFocus() {
    this.attachDropdownOpen.set(true);
    if (this.attachSearchResults().length === 0) {
      this.performApplicantSearch(this.attachSearchQuery);
    }
  }

  onAttachBlur() {
    setTimeout(() => this.attachDropdownOpen.set(false), 200);
  }

  private performApplicantSearch(query: string) {
    this.attachSearching.set(true);
    this.applicantService
      .getAll({ search: query?.trim() || undefined, page: 1, limit: 20 })
      .subscribe({
        next: (res) => {
          const items = ((res.data as any)?.items ??
            res.data ??
            []) as Applicant[];
          this.attachSearchResults.set(
            items.filter((item) => canAttachVacancyToApplicant(item.status)),
          );
          this.attachSearching.set(false);
        },
        error: () => {
          const all = this.mockData.getApplicants({
            search: query?.trim() || undefined,
          });
          this.attachSearchResults.set(
            all
              .filter((item) => canAttachVacancyToApplicant(item.status))
              .slice(0, 20),
          );
          this.attachSearching.set(false);
        },
      });
  }

  selectAttachApplicant(applicant: Applicant) {
    this.attachSelectedApplicant.set(applicant);
    this.attachData.applicantId = applicant.id;
    this.attachSearchQuery = applicant.user?.fullName ?? '';
    this.attachSearchResults.set([]);
    this.attachDropdownOpen.set(false);
  }

  clearAttachApplicant() {
    this.attachSelectedApplicant.set(null);
    this.attachData.applicantId = '';
    this.attachSearchQuery = '';
    this.attachSearchResults.set([]);
    this.attachDropdownOpen.set(false);
  }

  filteredVacancies(): Vacancy[] {
    const q = this.vacancySearchQuery.trim().toLowerCase();
    if (!q) return this.vacancies();
    return this.vacancies().filter((v) => {
      const values = [v.title, v.code, v.id, v.status, v.department?.name];
      return values.some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(q),
      );
    });
  }

  onVacancyFocus() {
    this.vacancyDropdownOpen.set(true);
  }

  onVacancyBlur() {
    setTimeout(() => this.vacancyDropdownOpen.set(false), 200);
  }

  onVacancySearchInput() {
    this.vacancyDropdownOpen.set(true);
    if (this.attachSelectedVacancy()) {
      this.attachSelectedVacancy.set(null);
      this.attachData.vacancyId = '';
    }
  }

  selectAttachVacancy(vacancy: Vacancy) {
    this.attachSelectedVacancy.set(vacancy);
    this.attachData.vacancyId = vacancy.id;
    this.vacancySearchQuery = `[${vacancy.code}] ${vacancy.title}`;
    this.vacancyDropdownOpen.set(false);
  }

  clearAttachVacancy() {
    this.attachSelectedVacancy.set(null);
    this.attachData.vacancyId = '';
    this.vacancySearchQuery = '';
    this.vacancyDropdownOpen.set(false);
  }

  saveAttachApplication() {
    const { applicantId, vacancyId, cvId } = this.attachData;
    const applicant =
      this.attachSelectedApplicant() ??
      this.mockData.getApplicantById(applicantId) ??
      null;
    const vacancy =
      this.vacancies().find((item) => item.id === vacancyId) ??
      this.mockData.getVacancyById(vacancyId);

    if (!applicantId || !vacancyId) {
      this.attachError = 'Applicant and vacancy are required.';
      return;
    }
    if (applicant && !canAttachVacancyToApplicant(applicant.status)) {
      this.attachError =
        'This applicant cannot be attached because the status is Hired or Banned.';
      return;
    }
    if (vacancy && !canAttachToVacancy(vacancy.status)) {
      this.attachError = 'Only open vacancies can accept new applicants.';
      return;
    }

    this.applicationService
      .create({ applicantId, vacancyId, cvId: cvId || undefined })
      .subscribe({
        next: () => {
          this.closeAttachDialog();
          this.loadApplications();
        },
        error: (err) => {
          this.attachError = err.error.message;
          // this.mockData.attachApplicantToVacancy({
          //   applicantId,
          //   vacancyId,
          //   cvId: cvId || undefined,
          // });
          // this.closeAttachDialog();
          // this.loadApplications();
        },
      });
  }

  openCVDetail(app: Application) {
    this.selectedApplication.set(app);
    this.showCVDetail.set(true);
  }

  closeCVDetail() {
    this.showCVDetail.set(false);
    this.selectedApplication.set(null);
  }

  canSchedule(app: Application): boolean {
    return (
      app.status === ApplicationStatus.PENDING ||
      app.status === ApplicationStatus.SCREENING
    );
  }

  openInterviewDialog(app: Application, event: Event) {
    event.stopPropagation();
    this.interviewApplication.set(app);
    this.interviewData = {
      applicationId: app.id,
      title: `Interview: ${app.applicant?.fullName} - ${app.vacancy?.title}`,
      description: '',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      platform: 'Google Meet',
    };
    this.selectedPanelIds = [];
    this.selectedInterviewDepartmentId = '';
    this.availableInterviewers.set([]);
    this.interviewError = '';
    this.availabilityPreview.set({});

    this.showInterviewDialog.set(true);
  }

  closeInterviewDialog() {
    this.showInterviewDialog.set(false);
    this.interviewError = '';
    this.availabilityPreview.set({});
    this.selectedInterviewDepartmentId = '';
    this.availableInterviewers.set([]);
    this.interviewApplication.set(null);
  }

  onInterviewDepartmentChange(departmentId: string) {
    this.selectedInterviewDepartmentId = departmentId;
    this.selectedPanelIds = [];
    this.availabilityPreview.set({});
    if (!departmentId) {
      this.availableInterviewers.set([]);
      return;
    }
    this.employeeService.getInterviewersByDepartment(departmentId).subscribe({
      next: (res) =>
        this.availableInterviewers.set(Array.isArray(res.data) ? res.data : []),
      error: () => this.availableInterviewers.set(this.getMockInterviewers()),
    });
  }

  togglePanelMember(employeeId: string) {
    const index = this.selectedPanelIds.indexOf(employeeId);
    if (index === -1) this.selectedPanelIds.push(employeeId);
    else this.selectedPanelIds.splice(index, 1);
    this.loadAvailabilityPreview();
  }

  isPanelSelected(employeeId: string): boolean {
    return this.selectedPanelIds.includes(employeeId);
  }

  onInterviewDateChange() {
    this.loadAvailabilityPreview();
  }

  loadAvailabilityPreview() {
    if (!this.interviewData.date || this.selectedPanelIds.length === 0) {
      this.availabilityPreview.set({});
      return;
    }

    const requests = this.selectedPanelIds.map((employeeId) =>
      this.interviewService
        .getAvailability({
          employeeId,
          startDate: this.interviewData.date,
          endDate: this.interviewData.date,
        })
        .pipe(
          catchError(() =>
            of({
              data: this.mockData.getAvailability(
                employeeId,
                this.interviewData.date,
                this.interviewData.date,
              ),
            } as any),
          ),
        ),
    );

    forkJoin(requests).subscribe((results) => {
      const preview: Record<
        string,
        { availableDate: string; startTime: string; endTime: string }[]
      > = {};
      results.forEach((result, index) => {
        preview[this.selectedPanelIds[index]] = (result.data ?? []).map(
          (slot: any) => ({
            availableDate: slot.availableDate,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }),
        );
      });
      this.availabilityPreview.set(preview);
    });
  }

  getEmployeeName(employeeId: string): string {
    return (
      this.availableInterviewers().find((item) => item.id === employeeId)
        ?.fullName ?? employeeId
    );
  }

  hasValidAvailability(): boolean {
    return this.selectedPanelIds.every((employeeId) => {
      const slots = this.availabilityPreview()[employeeId] ?? [];
      return slots.some(
        (slot) =>
          this.interviewData.startTime >= slot.startTime &&
          this.interviewData.endTime <= slot.endTime,
      );
    });
  }

  saveInterview() {
    const {
      applicationId,
      title,
      description,
      date,
      startTime,
      endTime,
      platform,
    } = this.interviewData;
    const applicantId =
      this.interviewApplication()?.applicantId ??
      this.interviewApplication()?.applicant?.id;

    if (!date || !startTime || !endTime) {
      this.interviewError = 'Date, start time and end time are required.';
      return;
    }
    if (new Date(date) <= new Date()) {
      this.interviewError = 'Interview date must be in the future.';
      return;
    }
    if (startTime >= endTime) {
      this.interviewError = 'End time must be after start time.';
      return;
    }
    if (this.selectedPanelIds.length === 0) {
      this.interviewError = 'Select at least one interviewer.';
      return;
    }
    if (!this.selectedInterviewDepartmentId) {
      this.interviewError = 'Please select department for this interview.';
      return;
    }
    if (!this.hasValidAvailability()) {
      this.interviewError =
        'The selected time is outside the available interview slots.';
      return;
    }

    const conflicts = this.mockData.getInterviewerConflicts(
      this.selectedPanelIds,
      date,
      startTime,
      endTime,
    );
    if (conflicts.length > 0) {
      this.interviewError = `Conflict: ${conflicts.join(', ')} already has an interview at this time.`;
      return;
    }
    if (applicantId) {
      const applicantConflicts = this.mockData.getApplicantInterviewConflicts(
        applicantId,
        date,
        startTime,
        endTime,
      );
      if (applicantConflicts.length > 0) {
        this.interviewError =
          'This applicant already has another interview at the selected time.';
        return;
      }
    }

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;

    // const dto: ScheduleInterviewDto = {
    //   applicationId,
    //   panel: this.selectedPanelIds.map((id) => ({
    //     employeeId: id,
    //     role:
    //       this.availableInterviewers().find((emp) => emp.id === id)?.position ??
    //       'Interviewer',
    //   })),
    //   interviewDate: date,
    //   startTime,
    //   endTime,
    //   platform,
    // };
    const dto: any = {
      applicationId: Number(applicationId), // BẮT BUỘC ÉP KIỂU SỐ (Vì Backend DTO dùng @IsNumber)
      title,
      description: description || '',
      panel: this.selectedPanelIds.map((id) => ({
        employeeId: String(id), // Ép kiểu chuỗi cho chắc chắn
        role: this.availableInterviewers().find((e) => e.id === id)?.position ?? 'Interviewer',
      })),
      startTime: startISO,
      endTime: endISO,
      platform,
    };

    // this.interviewService.schedule(dto).subscribe({
    //   next: () => {
    //     this.closeInterviewDialog();
    //     this.loadApplications();
    //   },
    //   error: () => {
    //     const duration =
    //       (new Date(`2000-01-01T${endTime}`).getTime() -
    //         new Date(`2000-01-01T${startTime}`).getTime()) /
    //       60000;
    //     this.mockData.addInterview({
    //       applicationId,
    //       date,
    //       time: startTime,
    //       duration,
    //       platform,
    //       interviewers: this.selectedPanelIds,
    //     });
    //     this.closeInterviewDialog();
    //     this.loadApplications();
    //   },
    // });
    this.loading.set(true);
    this.interviewService.schedule(dto).subscribe({
      next: () => {
        this.loading.set(false);
        alert('Interview scheduled successfully! Emails and Google Meet links are being sent.');
        this.closeInterviewDialog();
        this.loadApplications();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading.set(false);
        this.interviewError = err.error?.message || 'Conflict detected or HR/Interviewer is not available at this time.';
      },
    });

  }

  private getApplicantNameByAppId(appId: string): string {
    const app = this.applications().find((a) => a.id === appId);
    return app?.applicant?.fullName ?? 'Applicant';
  }

  getStatusClass(status: string): string {
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

  getScoreClass(score: number | undefined): string {
    if (score === undefined || score === null) return 'score-none';
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    if (score >= 40) return 'score-fair';
    return 'score-low';
  }

  getInitials(name: string) {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(-2)
      .join('')
      .toUpperCase();
  }

  displayApplicationDate(app: Application) {
    return app.appliedAt || app.createdAt || app.updatedAt;
  }

  displayApplicationScore(app: Application) {
    return app.aiPreview?.matchScore ?? app.aiMatchScore;
  }

  private getMockInterviewers(): Employee[] {
    return [
      {
        id: 'emp-uuid-001',
        fullName: 'Nguyen Van An',
        email: 'an@abc.com',
        departmentId: 'dept-1',
        position: 'Tech Lead',
        role: 'Interviewer',
      },
      {
        id: 'emp-uuid-003',
        fullName: 'Le Van Cuong',
        email: 'cuong@abc.com',
        departmentId: 'dept-1',
        position: 'Senior Developer',
        role: 'Interviewer',
      },
    ];
  }

  viewSelectedApplicationCV() {
    const fileUrl = this.selectedApplication()?.cv?.fileUrl;
    if (!fileUrl) return;
    const resolvedUrl = fileUrl.startsWith('http')
      ? fileUrl
      : `${environment.baseUrl}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    window.open(resolvedUrl, '_blank');
  }

  displayedResultsCount(): number {
    if (this.searchQuery.trim() && !this.useBackendSearch()) {
      return this.visibleApplications().length;
    }
    return this.totalItems();
  }

  private loadInterviewDepartments() {
    this.departmentService.getAll().subscribe({
      next: (res) =>
        this.interviewDepartments.set(Array.isArray(res.data) ? res.data : []),
      error: () => this.interviewDepartments.set([]),
    });
  }

  private useBackendSearch(): boolean {
    const query = this.searchQuery.trim();
    if (!query) return false;
    return !/^[avr]\d+/i.test(query);
  }

  private applyLocalSearch(applications: Application[]): Application[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((app) => {
      const values = [
        app.code,
        app.id,
        app.applicantId,
        app.vacancyId,
        app.applicant?.id,
        app.vacancy?.id,
        app.applicant?.code,
        app.vacancy?.code,
        app.applicant?.fullName,
        app.applicant?.email,
        app.vacancy?.title,
      ];
      return values.some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(query),
      );
    });
  }
}
