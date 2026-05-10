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
  readonly isHR = computed(() => this.auth.isHR() || this.auth.isSuperadmin());
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
    if (this.isHR() || this.isSuperadmin()) {
      this.loadHRDashboard();
    } else {
      this.loadInterviewerDashboard();
    }
  }

  private loadHRDashboard() {
    this.dashboardService.activityOverview().subscribe({
      next: (res) => {
        this.stats.set(res.data);
      },
      error: (err) => {},
    });

    this.interviewService
      .getAll({ status: InterviewStatus.SCHEDULED })
      .subscribe({
        next: (res) => {
          this.upcomingInterviews.set(res.data.items);
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
    // Load real interviewer stats from backend
    this.dashboardService.interviewerOverview().subscribe({
      next: (res) => {
        this.interviewerStats.set(res.data);
      },
      error: () => {},
    });

    // Load upcoming interviews for the interviewer
    this.interviewService
      .getAll({ status: InterviewStatus.SCHEDULED })
      .subscribe({
        next: (res) => {
          this.upcomingInterviews.set(res.data.items);
        },
      });
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
      Screening: 'badge-warning',
      'Interview Scheduled': 'badge-info',
      Selected: 'badge-success',
      Rejected: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return hours + ' giờ trước';
    const days = Math.floor(hours / 24);
    return days + ' ngày trước';
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
