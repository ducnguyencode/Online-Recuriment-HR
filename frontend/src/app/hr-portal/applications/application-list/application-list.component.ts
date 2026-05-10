import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, Subject, skip } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ApplicantService } from '../../../core/services/applicant.service';
import { ApplicationService } from '../../../core/services/application.service';
import {
  InterviewService,
  ScheduleInterviewDto,
} from '../../../core/services/interview.service';
import { VacancyService } from '../../../core/services/vacancy.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import {
  AiPreviewStatus,
  Applicant,
  Application,
  ApplicationStatus,
  Employee,
  UserRole,
  Vacancy,
  VacancyStatus,
  canAttachToVacancy,
  canAttachVacancyToApplicant,
} from '../../../core/models';
import { environment } from '../../../../environments/environment';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm-message.service';

@Component({
  selector: 'app-LApplication-LList',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss',
})
export class ApplicationListComponent implements OnInit, OnDestroy {
  AiPreviewStatus = AiPreviewStatus;
  ApplicationStatus = ApplicationStatus;
  UserRole = UserRole;
  applicationStatusList = Object.values(ApplicationStatus);
  applications = signal<Application[]>([]);
  vacancies = signal<Vacancy[]>([]);
  applicants = signal<Applicant[]>([]);
  availableInterviewers = signal<Employee[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  totalPages = signal(1);
  attachSearching = signal(false);

  searchQuery = '';
  filterStatus = '';
  selectedVacancyId = '';
  filterStartDate = '';
  filterEndDate = '';

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
  selectedInterviewerId = '';
  busySlots = signal<any[]>([]);

  showAttachDialog = signal(false);
  attachData = { applicantId: '', vacancyId: '', cvId: '' };
  attachError = '';

  constructor(
    private applicantService: ApplicantService,
    private applicationService: ApplicationService,
    private interviewService: InterviewService,
    private vacancyService: VacancyService,
    private employeeService: EmployeeService,
    private mockData: MockDataService,
    private socketService: SocketService,
    protected authService: AuthService,
    private toastService: ToastService,
    private confirmService: ConfirmService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    // Read search query param from header search
    const searchParam = this.route.snapshot.queryParamMap.get('search');
    if (searchParam) {
      this.searchQuery = searchParam;
    }

    this.loadVacancies();
    this.loadApplications();

    // Handle subsequent header searches (same-route navigation)
    this.route.queryParams
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe((params) => {
        const searchParam = params['search'];
        if (searchParam) {
          this.searchQuery = searchParam;
          this.currentPage.set(1);
          this.loadApplications();
        }
      });

    this.attachSearchSubject
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => this.performApplicantSearch(q));

    this.socketService.connect();
    this.socketService.onDone((res) => {
      const { applicationId, data } = res;
      if (data === 'new') {
        this.loadApplications();
        return;
      }
      this.applications.update((apps) =>
        apps.map((a) =>
          a.id == applicationId ? { ...a, aiPreview: data } : a,
        ),
      );
    });
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
    const dateRange = this.getApplicationDateRange();
    this.applicationService
      .getAll({
        status: this.filterStatus || undefined,
        vacancyId: this.selectedVacancyId || undefined,
        ...dateRange,
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
          raw = this.applyLocalDateFilter(raw);
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
    // If backend search was used, don't double-filter locally
    if (this.useBackendSearch()) return this.applications();
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
        (app.applicant as any)?.user?.fullName,
        app.applicant?.email,
        (app.applicant as any)?.user?.email,
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

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadApplications();
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

  onSearchChange() {
    this.currentPage.set(1);
    this.loadApplications();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStatus = '';
    this.selectedVacancyId = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
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
    return app.status === ApplicationStatus.PENDING;
  }

  openInterviewDialog(app: Application, event: Event) {
    event.stopPropagation();
    this.interviewApplication.set(app);

    const deptId = app.vacancy?.departmentId || app.vacancy?.department?.id;

    this.interviewData = {
      applicationId: app.id,
      title: `Interview: ${app.applicant?.fullName} - ${app.vacancy?.title}`,
      description: '',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      platform: 'Google Meet',
    };
    // this.selectedPanelIds = [];
    this.selectedInterviewDepartmentId = '';
    this.availableInterviewers.set([]);
    this.interviewError = '';
    // this.availabilityPreview.set({});

    this.showInterviewDialog.set(true);

    if (deptId) {
      this.employeeService.getInterviewersByDepartment(deptId).subscribe({
        next: (res: any) => {
          const rawData =
            res?.data?.items || res?.data || res?.items || res || [];
          const dataArray = Array.isArray(rawData) ? rawData : [];

          const mappedInterviewers = dataArray.map((emp: any) => ({
            ...emp,
            id: String(emp.id || emp.employeeId || Math.random()),
            fullName: emp.user?.fullName || emp.fullName || 'Unknown Name',
            position: emp.position || emp.role || 'Interviewer',
          }));

          this.availableInterviewers.set(mappedInterviewers);
        },
        error: (err) => {
          console.error('Error:', err);
          this.availableInterviewers.set([]);
        },
      });
    } else {
      this.availableInterviewers.set([]);
      this.interviewError =
        'Note: This vacancy has not been assigned a department, so the list of interviewers cannot be loaded!';
    }
  }

  closeInterviewDialog() {
    this.showInterviewDialog.set(false);
    this.interviewError = '';
    this.busySlots.set([]);
    this.selectedInterviewerId = '';
    this.selectedInterviewDepartmentId = '';
    this.availableInterviewers.set([]);
    this.interviewApplication.set(null);
  }

  onInterviewDepartmentChange(departmentId: string) {
    this.selectedInterviewDepartmentId = departmentId;
    this.selectedInterviewerId = '';
    this.busySlots.set([]);

    if (!departmentId) {
      this.availableInterviewers.set([]);
      return;
    }

    this.employeeService.getInterviewersByDepartment(departmentId).subscribe({
      next: (res: any) => {
        const rawData =
          res?.data?.items || res?.data || res?.items || res || [];
        const dataArray = Array.isArray(rawData) ? rawData : [];
        const mappedInterviewers = dataArray.map((emp: any) => ({
          ...emp,
          id: String(emp.id || emp.employeeId || Math.random()),
          fullName: emp.user?.fullName || emp.fullName || 'Unknown Name',
          position: emp.position || emp.role || 'Interviewer',
        }));

        this.availableInterviewers.set(mappedInterviewers);
      },

      error: () => this.availableInterviewers.set(this.getMockInterviewers()),
    });
  }

  onInterviewerChange(employeeId: string) {
    this.selectedInterviewerId = employeeId;
    this.busySlots.set([]);

    if (!employeeId) return;

    this.interviewService
      .getAvailability({
        employeeId: employeeId,
        startDate: '2024-01-01',
        endDate: '2030-12-31',
      })
      .pipe(catchError(() => of({ data: [] })))
      .subscribe({
        next: (res) => {
          this.busySlots.set(Array.isArray(res.data) ? res.data : []);
        },
      });
  }

  getEmployeeName(employeeId: string): string {
    return (
      this.availableInterviewers().find((item) => item.id === employeeId)
        ?.fullName ?? employeeId
    );
  }

  saveInterview() {
    const { applicationId, title, description, date, startTime, endTime } =
      this.interviewData;
    const applicantId =
      this.interviewApplication()?.applicantId ??
      this.interviewApplication()?.applicant?.id;

    if (!date || !startTime || !endTime) {
      this.interviewError = 'Date, start time and end time are required.';
      return;
    }

    const startDateTime = new Date(`${date}T${startTime}:00`);
    const bufferTime = new Date(Date.now() + 60 * 60 * 1000); // now + 1 hour
    if (startDateTime <= bufferTime) {
      this.interviewError = 'Start time must be at least 1 hour from now.';
      return;
    }
    if (startTime >= endTime) {
      this.interviewError = 'End time must be after start time.';
      return;
    }
    if (!this.selectedInterviewerId) {
      this.interviewError = 'Please select an interviewer.';
      return;
    }

    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;

    const dto: any = {
      applicationId: Number(applicationId),
      title,
      description: description ? String(description) : undefined,
      startTime: startISO,
      endTime: endISO,
      interviewerId: this.selectedInterviewerId,
    };

    this.loading.set(true);
    this.interviewService.schedule(dto).subscribe({
      next: () => {
        this.loading.set(false);
        // alert('Interview scheduled successfully! Emails and Google Meet links are being sent.');
        this.toastService.success(
          'Interview scheduled successfully! Emails and Google Meet links are being sent.',
        );
        this.closeInterviewDialog();
        this.loadApplications();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading.set(false);
        this.interviewError =
          err.error?.message ||
          'Conflict detected or HR/Interviewer is not available at this time.';
      },
    });
  }

  private getApplicantNameByAppId(appId: string): string {
    const app = this.applications().find((a) => a.id === appId);
    return app?.applicant?.fullName ?? 'Applicant';
  }

  getStatusClass(status: ApplicationStatus): string {
    const map: Record<string, string> = {
      [ApplicationStatus.PENDING]: 'badge-neutral',
      [ApplicationStatus.INTERVIEW_SCHEDULED]: 'badge-info',
      [ApplicationStatus.PENDING_REVIEW]: 'badge-warning',
      [ApplicationStatus.SELECTED]: 'badge-success',
      [ApplicationStatus.REJECTED]: 'badge-danger',
      [ApplicationStatus.NOT_REQUIRED]: 'badge-neutral',
    };
    return map[status] ?? 'badge-neutral';
  }

  shortenStatus(status: string): string {
    const shortMap: Record<string, string> = {
      'Interview Scheduled': 'Scheduled',
      'Pending Review': 'In Review',
    };
    return shortMap[status] ?? status;
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

  canSelectApplication(app: Application): boolean {
    const vacancy = app.vacancy;
    if (!vacancy) return true;
    if (vacancy.status !== VacancyStatus.OPENED) return false;
    return (
      Number(vacancy.filledCount ?? 0) <
      Number(vacancy.numberOfOpenings ?? 0)
    );
  }

  getSelectDisabledReason(app: Application): string {
    return this.canSelectApplication(app)
      ? 'Select applicant'
      : 'This vacancy is closed or has no remaining openings.';
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
      : `${environment.baseUrl}/uploads${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    window.open(resolvedUrl, '_blank');
  }

  displayedResultsCount(): number {
    if (this.searchQuery.trim() && !this.useBackendSearch()) {
      return this.visibleApplications().length;
    }
    return this.totalItems();
  }

  private loadInterviewersForApplication(app: Application) {
    const departmentId = app.vacancy?.departmentId ?? '';
    if (departmentId) {
      this.employeeService.getInterviewersByDepartment(departmentId).subscribe({
        next: (res) => {
          console.log(res.data.items);
          this.availableInterviewers.set(
            Array.isArray(res.data.items) ? res.data.items : [],
          );
          console.log(this.availableInterviewers());
        },
        error: () => this.availableInterviewers.set(this.getMockInterviewers()),
      });
      return;
    }

    const vacancyId = app.vacancy?.id ?? app.vacancyId;
    if (!vacancyId) {
      this.availableInterviewers.set(this.getMockInterviewers());
      return;
    }

    this.vacancyService.getById(vacancyId).subscribe({
      next: (res) => {
        const resolvedDepartmentId = res.data?.departmentId ?? '';
        if (!resolvedDepartmentId) {
          this.availableInterviewers.set(this.getMockInterviewers());
          return;
        }
        this.employeeService
          .getInterviewersByDepartment(resolvedDepartmentId)
          .subscribe({
            next: (employeeRes) => {
              this.availableInterviewers.set(
                Array.isArray(employeeRes.data) ? employeeRes.data : [],
              );
            },
            error: () =>
              this.availableInterviewers.set(this.getMockInterviewers()),
          });
      },
      error: () => this.availableInterviewers.set(this.getMockInterviewers()),
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

  private getApplicationDateRange(): {
    startDate?: string;
    endDate?: string;
  } {
    if (this.filterStartDate && this.filterEndDate) {
      return {
        startDate: this.filterStartDate,
        endDate: this.filterEndDate,
      };
    }

    const singleDate = this.filterStartDate || this.filterEndDate;
    if (!singleDate) return {};

    return {
      startDate: singleDate,
      endDate: singleDate,
    };
  }

  private applyLocalDateFilter(applications: Application[]): Application[] {
    const { startDate, endDate } = this.getApplicationDateRange();
    if (!startDate || !endDate) return applications;

    const start = new Date(`${startDate}T00:00:00`).getTime();
    const end = new Date(`${endDate}T23:59:59.999`).getTime();
    return applications.filter((app) => {
      const date = new Date(app.createdAt ?? app.updatedAt ?? '').getTime();
      return Number.isFinite(date) && date >= start && date <= end;
    });
  }

  selectApplication(applicationId: string) {
    this.confirmService.show(
      'Are you sure you want to select this applicant?',
      'Select Applicant',
      'info',
      true,
      true,
      () => {
        this.applicationService
          .changeStatus(applicationId, ApplicationStatus.SELECTED)
          .subscribe({
            next: (res) => {
              this.loadApplications();
            },
            error: (err) => {
              this.toastService.show(err.error.message, 'error');
            },
          });
      },
    );
  }

  rejetedApplication(applicationId: string) {
    this.confirmService.show(
      'Are you sure to reject this applicant',
      'Reject Applicant',
      'info',
      true,
      true,
      () => {
        this.applicationService
          .changeStatus(applicationId, ApplicationStatus.REJECTED)
          .subscribe({
            next: (res) => {
              this.loadApplications();
            },
            error: (err) => {
              this.toastService.show(err.error.message, 'error');
            },
          });
      },
    );
  }

  getMinDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onStartTimeChange(newStartTime: string) {
    if (!newStartTime) return;

    const parts = newStartTime.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    let endHours = hours + 1;

    if (endHours >= 24) {
      endHours = endHours - 24;
    }

    const endHoursStr = endHours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');

    this.interviewData.endTime = `${endHoursStr}:${minutesStr}`;
  }
}
