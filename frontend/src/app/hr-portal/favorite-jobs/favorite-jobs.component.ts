import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FavoriteJobService, FavoriteJob } from '../../core/services/favorite-job.service';
import { VacancyService } from '../../core/services/vacancy.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Vacancy } from '../../core/models';

@Component({
  selector: 'app-favorite-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './favorite-jobs.component.html',
  styleUrl: './favorite-jobs.component.scss',
})
export class FavoriteJobsComponent implements OnInit {
  favorites = signal<FavoriteJob[]>([]);
  vacancies = signal<Vacancy[]>([]);
  loading = signal(false);

  selectedVacancyId = '';
  searchQuery = '';

  constructor(
    private favoriteJobService: FavoriteJobService,
    private vacancyService: VacancyService,
    private mockData: MockDataService,
  ) {}

  ngOnInit() {
    this.loadVacancies();
    this.loadFavorites();
  }

  loadVacancies() {
    this.vacancyService.getAll({ status: 'Open' }).subscribe({
      next: res => {
        const items = (res.data as any)?.items ?? res.data ?? [];
        this.vacancies.set(items);
      },
      error: () => {
        const raw = this.mockData.getVacancies({ status: 'Open' });
        this.vacancies.set(raw.map(v => ({ ...v, id: String(v.id), departmentId: String(v.departmentId), ownedByEmployeeId: String(v.ownedByEmployeeId), numberOfOpenings: (v as any).openings ?? 1, closingDate: (v as any).deadline ?? '' })) as unknown as Vacancy[]);
      }
    });
  }

  loadFavorites() {
    this.loading.set(true);
    const vacId = this.selectedVacancyId || undefined;
    this.favoriteJobService.getAll(vacId).subscribe({
      next: res => {
        const items: FavoriteJob[] = (res.data as any)?.items ?? [];
        this.favorites.set(items);
        this.loading.set(false);
      },
      error: () => {
        // Mock: generate sample data since mock service has no favorite-jobs
        this.favorites.set(this.getMockFavorites());
        this.loading.set(false);
      }
    });
  }

  onVacancyChange() {
    this.loadFavorites();
  }

  filteredFavorites(): FavoriteJob[] {
    if (!this.searchQuery.trim()) return this.favorites();
    const q = this.searchQuery.toLowerCase();
    return this.favorites().filter(f =>
      f.applicant.fullName.toLowerCase().includes(q) ||
      f.applicant.email.toLowerCase().includes(q) ||
      f.vacancy.title.toLowerCase().includes(q)
    );
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).slice(-2).join('').toUpperCase();
  }

  private getMockFavorites(): FavoriteJob[] {
    return [
      {
        id: 'fav-001',
        applicant: { id: 'a1', fullName: 'Nguyen Thi An', email: 'an@example.com', phone: '0901111111' },
        vacancy: { id: '1', title: 'Senior Frontend Developer' },
        savedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        hasApplied: false,
      },
      {
        id: 'fav-002',
        applicant: { id: 'a2', fullName: 'Le Van Binh', email: 'binh@example.com', phone: '0902222222' },
        vacancy: { id: '6', title: 'Backend Engineer' },
        savedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        hasApplied: false,
      },
      {
        id: 'fav-003',
        applicant: { id: 'a3', fullName: 'Pham Thi Cam', email: 'cam@example.com', phone: '0903333333' },
        vacancy: { id: '1', title: 'Senior Frontend Developer' },
        savedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        hasApplied: false,
      },
    ];
  }
}
