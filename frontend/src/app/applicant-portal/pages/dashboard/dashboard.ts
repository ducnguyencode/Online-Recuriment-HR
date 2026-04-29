import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { Application, ApplicationStatus } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  applications = signal<Application[]>([]);

  showToast = false;
  toastMessage = '';

  constructor(
    private applicationService: ApplicationService,
    private authService: AuthService,
  ) {}
  ngOnInit(): void {
    this.applicationService
      .getAll({
        applicantId: this.authService.currentUser()?.applicantId,
      })
      .subscribe({
        next: (res) => {
          this.applications.set((res.data as any)?.items) ?? [];
        },
      });
  }

  getStatusClass(status: ApplicationStatus): string {
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
}
