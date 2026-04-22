import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  readonly isHR = computed(() => this.auth.isHR() || this.auth.isSuperadmin());
  readonly isSuperadmin = computed(() => this.auth.isSuperadmin());

  stats = signal({ openVacancies: 0, applicantsInProcess: 0, todayInterviews: 0, nearDeadline: 0, totalApplications: 0, hiringRate: 0 });

  recentVacancies = signal<any[]>([]);
  upcomingInterviews = signal<any[]>([]);
  recentApplications = signal<any[]>([]);

  constructor(private auth: AuthService, private mockData: MockDataService) {}

  ngOnInit() {

    // Load data from MockDataService
    this.stats.set(this.mockData.getDashboardStats());

    const vacs = this.mockData.getVacancies();
    this.recentVacancies.set(vacs.slice(0, 5).map(v => ({
      id: v.code, title: v.title, department: v.department?.name || '', filledCount: v.filledCount, openings: v.numberOfOpenings, status: v.status,
    })));

    const apps = this.mockData.getApplications();
    this.recentApplications.set(apps.slice(0, 4).map(a => ({
      applicant: a.applicant?.fullName || '', vacancy: a.vacancy?.title || '', status: a.status,
      time: this.timeAgo(a.createdAt || a.appliedAt || a.updatedAt),
    })));

    const upcoming = this.mockData
      .getInterviews()
      .filter((item: any) => new Date(`${item.date}T${item.startTime || '00:00'}`).getTime() >= Date.now())
      .sort(
        (a: any, b: any) =>
          new Date(`${a.date}T${a.startTime || '00:00'}`).getTime() -
          new Date(`${b.date}T${b.startTime || '00:00'}`).getTime(),
      )
      .slice(0, 3)
      .map((item: any) => ({
        applicant: item.applicantName || '—',
        vacancy: item.vacancyTitle || '—',
        date: item.date,
        time: item.startTime || '—',
        platform: item.platform || 'Google Meet',
      }));
    this.upcomingInterviews.set(upcoming);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Open': 'badge-success',
      'Opened': 'badge-success',
      'Suspended': 'badge-warning',
      'Close': 'badge-danger',
      'Closed': 'badge-danger',
      'Pending': 'badge-neutral',
      'Screening': 'badge-warning',
      'Interview Scheduled': 'badge-info',
      'Selected': 'badge-success',
      'Rejected': 'badge-danger',
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
