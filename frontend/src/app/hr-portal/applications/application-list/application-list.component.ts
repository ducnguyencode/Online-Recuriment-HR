import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
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
  Applicant,
  Application,
  Employee,
  Vacancy,
  canAttachToVacancy,
  canAttachVacancyToApplicant,
  formatDisplayId,
} from '../../../core/models';

@Component({
  selector: 'app-LApplication-LList',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss',
})
export class ApplicationListComponent implements OnInit {
  applications = signal<Application[]>([]);
  vacancies = signal<Vacancy[]>([]);
  applicants = signal<Applicant[]>([]);
  availableInterviewers = signal<Employee[]>([]);
  loading = signal(false);

  searchQuery = '';
  filterStatus = '';
  selectedVacancyId = '';

  // Pagination
  currentPage = signal(1);
  readonly pageSize = 20;

  // Attach dialog search
  attachSearchQuery = '';
  attachSearchResults = signal<Applicant[]>([]);
  attachSelectedApplicant = signal<Applicant | null>(null);

  showCVDetail = signal(false);
  selectedApplication = signal<Application | null>(null);

  showInterviewDialog = signal(false);
  selectedPanelIds: string[] = [];
  interviewData = {
    applicationId: '',
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
    private mockData: MockDataService,
  ) {}

  ngOnInit() {
    this.loadVacancies();
    this.loadApplicants();
    this.loadApplications();
  }

  loadApplicants() {
    this.applicantService.getAll({ page: 1, limit: 100 }).subscribe({
      next: (res) => {
        const items = (res.data as any)?.items ?? res.data ?? [];
        this.applicants.set(items);
      },
      error: () => {
        this.applicants.set(this.mockData.getApplicants());
      },
    });
  }

  loadVacancies() {
    this.vacancyService.getAll({ status: 'Opened' }).subscribe({
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
      })
      .subscribe({
        next: (res) => {
          const items: Application[] = (res.data as any)?.items ?? [];
          this.applications.set(items);
          this.loading.set(false);
        },
        error: () => {
          const raw = this.mockData.getApplications({
            ...(this.filterStatus ? { status: this.filterStatus as any } : {}),
            ...(this.selectedVacancyId
              ? { vacancyId: this.selectedVacancyId }
              : {}),
          });
          const items = raw.map((a) => ({
            ...a,
            id: String(a.id),
            applicantId: String(a.applicantId),
            vacancyId: String(a.vacancyId),
          })) as unknown as Application[];
          this.applications.set(items);
          this.loading.set(false);
        },
      });
  }

  filteredApplications(): Application[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.applications();
    return this.applications().filter((app) => {
      const values = [
        app.id,
        app.applicantId,
        app.vacancyId,
        app.applicant?.fullName,
        app.applicant?.email,
        app.vacancy?.title,
      ];
      return values.some((value) =>
        (value ?? '').toLowerCase().includes(query),
      );
    });
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(this.filteredApplications().length / this.pageSize),
    );
  }

  pagedApplications(): Application[] {
    const all = this.filteredApplications();
    const start = (this.currentPage() - 1) * this.pageSize;
    return all.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages)));
  }

  onSearchChange() {
    this.currentPage.set(1);
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
    this.showAttachDialog.set(true);
  }

  closeAttachDialog() {
    this.showAttachDialog.set(false);
    this.attachError = '';
    this.attachSearchQuery = '';
    this.attachSearchResults.set([]);
    this.attachSelectedApplicant.set(null);
  }

  onAttachSearch() {
    const q = this.attachSearchQuery.trim().toLowerCase();
    if (!q) {
      this.attachSearchResults.set([]);
      return;
    }
    const all = this.applicants().filter(
      (a) =>
        canAttachVacancyToApplicant(a.status) &&
        (a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          String(a.id).toLowerCase().includes(q)),
    );
    this.attachSearchResults.set(all.slice(0, 10));
  }

  selectAttachApplicant(applicant: Applicant) {
    this.attachSelectedApplicant.set(applicant);
    this.attachData.applicantId = applicant.id;
    this.attachSearchQuery = applicant.fullName;
    this.attachSearchResults.set([]);
  }

  clearAttachApplicant() {
    this.attachSelectedApplicant.set(null);
    this.attachData.applicantId = '';
    this.attachSearchQuery = '';
    this.attachSearchResults.set([]);
  }

  saveAttachApplication() {
    const { applicantId, vacancyId, cvId } = this.attachData;
    const applicant = this.applicants().find((item) => item.id === applicantId);
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
        error: () => {
          this.mockData.attachApplicantToVacancy({
            applicantId,
            vacancyId,
            cvId: cvId || undefined,
          });
          this.closeAttachDialog();
          this.loadApplications();
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
    return app.status === 'Pending' || app.status === 'Screening';
  }

  availableApplicants(): Applicant[] {
    return this.applicants().filter((item) =>
      canAttachVacancyToApplicant(item.status),
    );
  }

  openInterviewDialog(app: Application, event: Event) {
    event.stopPropagation();
    this.interviewData = {
      applicationId: app.id,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      platform: 'Google Meet',
    };
    this.selectedPanelIds = [];
    this.interviewError = '';
    this.availabilityPreview.set({});

    const departmentId = app.vacancy?.departmentId ?? '';
    if (departmentId) {
      this.employeeService.getInterviewersByDepartment(departmentId).subscribe({
        next: (res) =>
          this.availableInterviewers.set(
            Array.isArray(res.data) ? res.data : [],
          ),
        error: () => this.availableInterviewers.set(this.getMockInterviewers()),
      });
    } else {
      this.availableInterviewers.set(this.getMockInterviewers());
    }

    this.showInterviewDialog.set(true);
  }

  closeInterviewDialog() {
    this.showInterviewDialog.set(false);
    this.interviewError = '';
    this.availabilityPreview.set({});
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
    const { applicationId, date, startTime, endTime, platform } =
      this.interviewData;

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

    const dto: ScheduleInterviewDto = {
      applicationId,
      panel: this.selectedPanelIds.map((id) => ({
        employeeId: id,
        role:
          this.availableInterviewers().find((emp) => emp.id === id)?.position ??
          'Interviewer',
      })),
      interviewDate: date,
      startTime,
      endTime,
      platform,
    };

    this.interviewService.schedule(dto).subscribe({
      next: () => {
        this.closeInterviewDialog();
        this.loadApplications();
      },
      error: () => {
        const duration =
          (new Date(`2000-01-01T${endTime}`).getTime() -
            new Date(`2000-01-01T${startTime}`).getTime()) /
          60000;
        this.mockData.addInterview({
          applicationId,
          date,
          time: startTime,
          duration,
          platform,
          interviewers: this.selectedPanelIds,
        });
        this.closeInterviewDialog();
        this.loadApplications();
      },
    });
  }

  getStatusClass(status: string): string {
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

  getScoreClass(score: number | undefined): string {
    if (!score) return 'score-low';
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
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

  applicantDisplayId(id?: string) {
    return formatDisplayId('A', id);
  }

  vacancyDisplayId(id?: string) {
    return formatDisplayId('V', id);
  }

  applicationDisplayId(id?: string) {
    return formatDisplayId('R', id);
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
}
