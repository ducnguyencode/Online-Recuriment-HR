import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { VacancyService } from '../../core/services/vacancy.service';
import { Application, Vacancy } from '../../core/models';
import { ApplicationService } from '../../core/services/application.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  isHR = false;
  isSuperadmin = false;
  stats = signal({
    openVacancies: 0,
    applicantsInProcess: 0,
    todayInterviews: 0,
    nearDeadline: 0,
    totalApplications: 0,
    hiringRate: 0,
  });

  recentVacancies = signal<any[]>([]);
  upcomingInterviews = signal<any[]>([
    {
      applicant: 'Hoàng Minh Tuấn',
      vacancy: 'Senior Frontend Developer',
      date: '11/04/2026',
      time: '09:00',
      platform: 'Google Meet',
    },
    {
      applicant: 'Đặng Văn Khoa',
      vacancy: 'Marketing Manager',
      date: '12/04/2026',
      time: '14:00',
      platform: 'Zoom',
    },
    {
      applicant: 'Trần Văn Nam',
      vacancy: 'Backend Engineer',
      date: '13/04/2026',
      time: '10:30',
      platform: 'Google Meet',
    },
  ]);
  recentApplications = signal<any[]>([]);

  constructor(
    private auth: AuthService,
    private mockData: MockDataService,
    private vacanciesService: VacancyService,
    private applicationService: ApplicationService,
  ) {}

  ngOnInit() {
    this.isHR = this.auth.isHR();
    this.isSuperadmin = this.auth.isSuperadmin();

    // Load data from MockDataService
    this.stats.set(this.mockData.getDashboardStats());

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
            time: this.timeAgo(a.createdAt),
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
}
