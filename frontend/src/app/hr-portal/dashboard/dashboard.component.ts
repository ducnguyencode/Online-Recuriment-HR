import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { VacancyService } from '../../core/services/vacancy.service';
import { Application, Vacancy } from '../../core/models';
import { ApplicationService } from '../../core/services/application.service';
import {
  DashboardService,
  OverviewDto,
} from '../../core/services/dasboard.service';

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

  recentVacancies = signal<any[]>([]);
  upcomingInterviews = signal<any[]>([]);
  recentApplications = signal<any[]>([]);

  constructor(
    private auth: AuthService,
    private mockData: MockDataService,
    private vacanciesService: VacancyService,
    private applicationService: ApplicationService,
    private dashboardService: DashboardService,
  ) {}

  ngOnInit() {
    // Load data from MockDataService
    this.dashboardService.activityOverview().subscribe({
      next: (res) => {
        this.stats.set(res.data);
      },
      error: (err) => {},
    });

    this.vacanciesService.getAll({ limit: 5 }).subscribe({
      next: (res) => {
        this.recentVacancies.set(res.data.items as Vacancy[]);
      },
      error: (err) => {
        const vacs = this.mockData.getVacancies();
        this.recentVacancies.set(
          vacs.slice(0, 5).map((v) => ({
            id: v.id,
            title: v.title,
            department: v.department?.name || '',
            filledCount: v.filledCount,
            openings: v.numberOfOpenings,
            status: v.status,
          })),
        );
      },
    });

    this.applicationService.getAll({ limit: 4 }).subscribe({
      next: (res) => {
        this.recentApplications.set(res.data.items as Application[]);
      },
      error: (error) => {
        const apps = this.mockData.getApplications();
        this.recentApplications.set(
          apps.slice(0, 4).map((a) => ({
            applicant: a.applicant?.fullName || '',
            vacancy: a.vacancy?.title || '',
            status: a.status,
            time: this.timeAgo(a.createdAt || ''),
          })),
        );
      },
    });
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

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(Math.abs(value));

    const sign = value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${formatted}%`;
  }
}
