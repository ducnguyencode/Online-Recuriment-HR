import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VacancyService } from '../../../core/services/vacancy.service';
import { Vacancy, VacancyStatus } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './careers.html',
  styleUrls: ['./careers.scss'],
})
export class CareersComponent implements OnInit {
  vacancies = signal<Vacancy[]>([]);
  loading = signal(false);
  errorMsg = signal('');

  // Filters
  searchQuery = '';
  filterStatus: VacancyStatus = VacancyStatus.OPENED;
  filterDepartment = '';

  private router = inject(Router);
  private vacancyService = inject(VacancyService);
  private auth = inject(AuthService);

  private mockData = [
    {
      id: 'V0001',
      title: 'Senior Frontend Developer (Angular)',
      description:
        'Lead the development of our recruitment platform using Angular 17 and Tailwind CSS.',
      department: { name: 'Engineering' },
      createdAt: new Date().toISOString(),
      closingDate: '2026-06-30',
      numberOfOpenings: 2,
      isFavorite: false,
    },
    {
      id: 'V0002',
      title: 'Backend Developer (NestJS)',
      description:
        'Build scalable microservices and manage MongoDB databases for high-traffic applications.',
      department: { name: 'Engineering' },
      createdAt: new Date().toISOString(),
      closingDate: '2026-07-15',
      numberOfOpenings: 5,
      isFavorite: true,
    },
    {
      id: 'V0003',
      title: 'UI/UX Product Designer',
      description:
        'Design intuitive and beautiful user interfaces for our applicant tracking system.',
      department: { name: 'Design' },
      createdAt: new Date().toISOString(),
      closingDate: '2026-05-20',
      numberOfOpenings: 1,
      isFavorite: false,
    },
  ];

  ngOnInit() {
    this.fetchJobs();
  }

  fetchJobs() {
    this.loading.set(true);
    this.errorMsg.set('');

    this.vacancyService
      .getAll({
        status: this.filterStatus || VacancyStatus.OPENED,
        departmentId: this.filterDepartment || undefined,
        search: this.searchQuery || undefined,
      })
      .subscribe({
        next: (res) => {
          const items = (res.data as any)?.items ?? res.data ?? [];
          this.vacancies.set(items);
          this.loading.set(false);
        },
        error: (err) => {
          this.errorMsg = err.error.message;
          this.loading.set(false);
        },
      });
  }

  toggleFavorite(job: any) {
    job.isFavorite = !job.isFavorite;
  }

  viewDetails(job: any) {
    alert('Opening details for: ' + job.title);
  }

  applyJob(job: any) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      alert('Applied successfully for: ' + job.title);
    }
  }
}
