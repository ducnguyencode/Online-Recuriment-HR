import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VacancyService } from '../../../core/services/vacancy.service';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './careers.html', // Make sure this matches your HTML file name
  styleUrls: ['./careers.scss']
})
export class CareersComponent implements OnInit {
  // 1. Set to true to test the Apply Modal (mocking logged-in state)
  isLoggedIn = true;

  // 2. Job list state
  jobs: any[] = [];
  isLoading = true;

  // 3. Modal state variables
  isApplyModalOpen = false;
  selectedJobTitle = '';

  private router = inject(Router);
  private vacancyService = inject(VacancyService);

  // Fallback mock data
  private mockData = [
    {
      id: 'V0001',
      title: 'Senior Frontend Developer (Angular)',
      description: 'Lead the development of our recruitment platform using Angular 17 and Tailwind CSS.',
      department: { name: 'Engineering' },
      createdAt: new Date().toISOString(),
      closingDate: '2026-06-30',
      numberOfOpenings: 2,
      isFavorite: false
    },
    {
      id: 'V0002',
      title: 'Backend Developer (NestJS)',
      description: 'Build scalable microservices and manage MongoDB databases for high-traffic applications.',
      department: { name: 'Engineering' },
      createdAt: new Date().toISOString(),
      closingDate: '2026-07-15',
      numberOfOpenings: 5,
      isFavorite: true
    },
    {
      id: 'V0003',
      title: 'UI/UX Product Designer',
      description: 'Design intuitive and beautiful user interfaces for our applicant tracking system.',
      department: { name: 'Design' },
      createdAt: new Date().toISOString(),
      closingDate: '2026-05-20',
      numberOfOpenings: 1,
      isFavorite: false
    }
  ];

  ngOnInit() {
    this.fetchJobs();
  }

  // Fetch jobs from API or use fallback data
  fetchJobs() {
    this.isLoading = true;

    this.vacancyService.getAll({ status: 'Opened' }).subscribe({
      next: (response: any) => {
        const apiJobs = response?.data?.items || response?.data || [];

        if (apiJobs && apiJobs.length > 0) {
          this.jobs = apiJobs.map((job: any) => ({
            ...job,
            isFavorite: false
          }));
        } else {
          this.jobs = [...this.mockData];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('API connection failed, using fallback mock data:', err);
        this.jobs = [...this.mockData];
        this.isLoading = false;
      }
    });
  }

  // Toggle favorite status
  toggleFavorite(job: any) {
    job.isFavorite = !job.isFavorite;
  }

  // Open job details
  viewDetails(job: any) {
    // Navigate to details page or open details modal
    alert('Opening details for: ' + job.title);
  }

  // Handle Apply button click
  applyJob(job: any) {
    if (!this.isLoggedIn) {
      // Redirect to login if user is not authenticated
      this.router.navigate(['/login']);
    } else {
      // Open the application modal if user is authenticated
      this.selectedJobTitle = job.title;
      this.isApplyModalOpen = true;
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }

  // Close the application modal
  closeApplyModal() {
    this.isApplyModalOpen = false;
    document.body.style.overflow = 'auto'; // Restore background scrolling
  }
}
