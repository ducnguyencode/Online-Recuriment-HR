import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { VacancyService } from '../../core/services/vacancy.service';
import {
  Application,
  Interview,
  InterviewStatus,
  Vacancy,
} from '../../core/models';
import { ApplicationService } from '../../core/services/application.service';
import {
  DashboardService,
  InterviewerOverviewDto,
  OverviewDto,
  SystemOverviewDto,
} from '../../core/services/dasboard.service';
import { InterviewService } from '../../core/services/interview.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly isHR = computed(() => this.auth.isHR());
  readonly isSuperadmin = computed(() => this.auth.isSuperadmin());

  stats = signal({
    applicantsHiredLastMonth: 0,
    applicantsHiredThisMonth: 0,
    applicationsProcessingLastMonth: 0,
    applicationsProcessingThisMonth: 0,
    applicationsThisMonth: 0,
    vacanciesLastMonth: 0,
    vacanciesThisMonth: 0,
    interviewToday: 0,
  });

  // Interviewer stats (loaded from backend)
  interviewerStats = signal<InterviewerOverviewDto>({
    upcomingInterviews: 0,
    passedVotes: 0,
    failedVotes: 0,
  });
  systemStats = signal<SystemOverviewDto>({
    users: 0,
    vacancies: 0,
    applications: 0,
    interviews: 0,
  });

  recentVacancies = signal<Vacancy[]>([]);
  upcomingInterviews = signal<Interview[]>([]);
  recentApplications = signal<Application[]>([]);

  // Pagination for Upcoming Interviews
  interviewPage = signal(1);
  readonly interviewPageSize = 5;
  readonly pagedInterviews = computed(() => {
    const all = this.upcomingInterviews();
    const start = (this.interviewPage() - 1) * this.interviewPageSize;
    return all.slice(start, start + this.interviewPageSize);
  });
  readonly interviewTotalPages = computed(() =>
    Math.ceil(this.upcomingInterviews().length / this.interviewPageSize) || 1,
  );

  // Pagination for Recent Applications
  applicationPage = signal(1);
  readonly applicationPageSize = 5;
  readonly pagedApplications = computed(() => {
    const all = this.recentApplications();
    const start = (this.applicationPage() - 1) * this.applicationPageSize;
    return all.slice(start, start + this.applicationPageSize);
  });
  readonly applicationTotalPages = computed(() =>
    Math.ceil(this.recentApplications().length / this.applicationPageSize) || 1,
  );

  constructor(
    private auth: AuthService,
    private mockData: MockDataService,
    private vacanciesService: VacancyService,
    private applicationService: ApplicationService,
    private dashboardService: DashboardService,
    private interviewService: InterviewService,
  ) {}

  ngOnInit() {
    const refresh = this.auth.refreshMe();
    if (refresh) {
      refresh.subscribe({
        next: () => this.loadDashboardForRole(),
        error: () => this.loadDashboardForRole(),
      });
      return;
    }
    this.loadDashboardForRole();
  }

  private loadDashboardForRole() {
    if (this.isSuperadmin()) {
      this.loadSuperAdminDashboard();
    } else if (this.isHR()) {
      this.loadHRDashboard();
    } else {
      this.loadInterviewerDashboard();
    }
  }

  private loadSuperAdminDashboard() {
    this.dashboardService.systemOverview().subscribe({
      next: (res) => {
        this.systemStats.set(res.data);
      },
      error: () => {},
    });

    this.loadRecruitmentLists();
  }

  private loadHRDashboard() {
    this.dashboardService.activityOverview().subscribe({
      next: (res) => {
        this.stats.set(res.data);
      },
      error: (err) => {},
    });

    this.loadRecruitmentLists();
  }

  private loadRecruitmentLists() {
    this.interviewService
      .getAll({ status: InterviewStatus.SCHEDULED, limit: 0 })
      .subscribe({
        next: (res) => {
          this.upcomingInterviews.set(this.onlyUpcoming(res.data.items));
        },
      });

    this.vacanciesService.getAll({ limit: 5 }).subscribe({
      next: (res) => {
        this.recentVacancies.set(res.data.items as Vacancy[]);
      },
      error: (err) => {},
    });

    this.applicationService.getAll({ limit: 20 }).subscribe({
      next: (res) => {
        this.recentApplications.set(res.data.items as Application[]);
      },
      error: (error) => {},
    });
  }

  private loadInterviewerDashboard() {
    this.dashboardService.interviewerOverview().subscribe({
      next: (res) => {
        this.interviewerStats.set(res.data);
        if (res.data.upcomingInterviewItems) {
          this.upcomingInterviews.set(
            this.onlyUpcoming(res.data.upcomingInterviewItems),
          );
        }
      },
      error: () => {},
    });

    const employeeId = this.auth.currentUser()?.employeeId;
    this.interviewService
      .getAll({
        status: InterviewStatus.SCHEDULED,
        limit: 0,
        employeeId: employeeId ? String(employeeId) : undefined,
      })
      .subscribe({
        next: (res) => {
          const items = this.onlyUpcoming(res.data.items);
          if (!this.upcomingInterviews().length) {
            this.upcomingInterviews.set(items);
          }
          this.interviewerStats.update((stats) => ({
            ...stats,
            upcomingInterviews:
              this.upcomingInterviews().length || items.length,
          }));
        },
      });
  }

  private onlyUpcoming(items: Interview[]): Interview[] {
    const now = Date.now();
    return items
      .filter((item) => new Date(item.startTime).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
  }

  // Pagination controls
  prevInterviewPage() {
    if (this.interviewPage() > 1) {
      this.interviewPage.update((p) => p - 1);
    }
  }
  nextInterviewPage() {
    if (this.interviewPage() < this.interviewTotalPages()) {
      this.interviewPage.update((p) => p + 1);
    }
  }
  prevApplicationPage() {
    if (this.applicationPage() > 1) {
      this.applicationPage.update((p) => p - 1);
    }
  }
  nextApplicationPage() {
    if (this.applicationPage() < this.applicationTotalPages()) {
      this.applicationPage.update((p) => p + 1);
    }
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Opened: 'badge-success',
      Suspended: 'badge-warning',
      Closed: 'badge-danger',
      Pending: 'badge-neutral',
      'Interview Scheduled': 'badge-info',
      'Pending Review': 'badge-warning',
      Selected: 'badge-success',
      Rejected: 'badge-danger',
      'Not Required': 'badge-neutral',
    };
    return map[status] || 'badge-neutral';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return hours + ' hour(s) ago';
    const days = Math.floor(hours / 24);
    return days + ' day(s) ago';
  }

  percentChange(current: number, previous: number): string {
    let value: number;

    if (previous === 0) {
      value = current > 0 ? 100 : 0;
    } else {
      value = ((current - previous) / previous) * 100;
    }

    value = 0 && value == -100;

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);

    const sign = value > 0 ? '+' : '';

    return `${sign}${formatted}%`;
  }

  calHireRate(hired: number, processing: number) {}
}
