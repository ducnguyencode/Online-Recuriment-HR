import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApplicationService } from '../../../core/services/application.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicationStatus } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  applications = signal<any[]>([]);
  savedJobs = signal<any[]>([]);
  loading = signal(false);

  private applicationService = inject(ApplicationService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.fetchApplications();
    this.loadSavedJobs();
  }

  fetchApplications() {
    const userId = this.authService.currentUser()?.applicantId;
    if (userId) {
      this.applicationService.getAll({ applicantId: userId }).subscribe({
        next: (res: any) => {
          const items = res.data?.items ?? res.data ?? [];
          this.applications.set(items);
        }
      });
    }
  }

  loadSavedJobs() {
    const saved = localStorage.getItem('saved_jobs');
    if (saved) this.savedJobs.set(JSON.parse(saved));
  }

  unsaveJob(jobId: string) {
    this.savedJobs.update(jobs => {
      const filtered = jobs.filter(j => j.id !== jobId);
      localStorage.setItem('saved_jobs', JSON.stringify(filtered));
      return filtered;
    });
    this.toast.success('Job removed from saved list');
  }

  getStatusClass(status: ApplicationStatus): string {
    const map: any = {
      [ApplicationStatus.PENDING]: 'bg-blue-50 text-blue-600 border-blue-100',
      [ApplicationStatus.SCREENING]: 'bg-amber-50 text-amber-600 border-amber-100',
      [ApplicationStatus.SELECTED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
    return map[status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
  }
}
