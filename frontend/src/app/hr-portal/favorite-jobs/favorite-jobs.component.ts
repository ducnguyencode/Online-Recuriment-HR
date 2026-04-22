import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FavoriteJobService,
  FavoriteJob,
} from '../../core/services/favorite-job.service';
import { VacancyService } from '../../core/services/vacancy.service';
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
  ) {}

  ngOnInit() {
    this.loadVacancies();
    this.loadFavorites();
  }

  loadVacancies() {
    this.vacancyService.getAll({ status: 'Open' }).subscribe({
      next: (res) => {
        const items = (res.data as any)?.items ?? res.data ?? [];
        this.vacancies.set(items);
      },
      error: () => this.vacancies.set([]),
    });
  }

  loadFavorites() {
    this.loading.set(true);
    const vacId = this.selectedVacancyId || undefined;
    this.favoriteJobService.getAll(vacId).subscribe({
      next: (res) => {
        const items: FavoriteJob[] = (res.data as any)?.items ?? [];
        this.favorites.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.favorites.set([]);
        this.loading.set(false);
      },
    });
  }

  onVacancyChange() {
    this.loadFavorites();
  }

  filteredFavorites(): FavoriteJob[] {
    if (!this.searchQuery.trim()) return this.favorites();
    const q = this.searchQuery.toLowerCase();
    return this.favorites().filter(
      (f) =>
        f.applicant.fullName.toLowerCase().includes(q) ||
        f.applicant.email.toLowerCase().includes(q) ||
        f.vacancy.title.toLowerCase().includes(q),
    );
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .slice(-2)
      .join('')
      .toUpperCase();
  }
}
