import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VacancyService } from '../../../core/services/vacancy.service';
import { Vacancy, VacancyStatus } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { ApplicantService } from '../../../core/services/applicant.service';
import {
  ApplicationService,
  CreateApplicationDto,
} from '../../../core/services/application.service';

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

  isApplyModalOpen = false;
  selectedJobTitle = '';

  applyForm = { applicantId: '', fullName: '', email: '', vacancyId: '' };
  cvUploadFile: File | null = null;

  private router = inject(Router);
  private vacancyService = inject(VacancyService);
  private auth = inject(AuthService);
  private applicantService = inject(ApplicantService);
  private applicationService = inject(ApplicationService);
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

  applyJob(vacancy: Vacancy) {
    if (!this.auth.isLoggedIn()) {
      // Redirect to login if user is not authenticated
      this.router.navigate(['/login']);
    } else {
      this.selectedJobTitle = vacancy.title;
      this.isApplyModalOpen = true;
      this.applyForm = {
        fullName: this.auth.currentUser()?.fullName || '',
        applicantId: this.auth.currentUser()?.applicantId || '',
        vacancyId: vacancy.id,
        email: this.auth.currentUser()?.email || '',
      };
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  }

  closeApplyModal() {
    this.isApplyModalOpen = false;
    this.applyForm = {
      applicantId: '',
      fullName: '',
      email: '',
      vacancyId: '',
    };
    this.cvUploadFile = null;
    document.body.style.overflow = 'auto';
  }

  selectCvFile(event: any) {
    this.cvUploadFile = event.target.files[0];
  }

  submitApplication() {
    const formData = new FormData();
    formData.append('applicantId', this.applyForm.applicantId);
    formData.append('file', this.cvUploadFile || '');
    this.applicantService.uploadCv(formData).subscribe({
      next: (res) => {
        if (res.data) {
          const dto: CreateApplicationDto = {
            applicantId: this.applyForm.applicantId,
            vacancyId: this.applyForm.vacancyId,
            cvId: res.data.id,
          };
          this.applicationService.create(dto).subscribe({
            next: (res) => {
              this.closeApplyModal();
            },
            error: (err) => {
              console.log(err);
            },
          });
        }
      },
      error: (err) => {},
    });
    console.log(this.applyForm);
    console.log(this.cvUploadFile);
  }
}
