import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { DepartmentService } from '../../core/services/department.service';
import { VacancyService } from '../../core/services/vacancy.service';
import { ApplicationService } from '../../core/services/application.service';
import {
  Application,
  Department,
  Vacancy,
  VacancyStatus,
} from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  stats = {
    totalApplications: 0,
    openVacancies: 0,
    hiringRate: 0,
    applicantsInProcess: 0,
  };

  pipelineData = [
    { label: 'Pending', count: 0, color: '#94A3B8' },
    { label: 'Screening', count: 0, color: '#F59E0B' },
    { label: 'Interviewing', count: 0, color: '#3B82F6' },
    { label: 'Selected', count: 0, color: '#22C55E' },
    { label: 'Rejected', count: 0, color: '#EF4444' },
  ];

  departmentData: {
    name: string;
    vacancies: number;
    applications: number;
  }[] = [];

  loadError = '';

  constructor(
    private departmentService: DepartmentService,
    private vacancyService: VacancyService,
    private applicationService: ApplicationService,
  ) {}

  ngOnInit() {
    forkJoin({
      deptRes: this.departmentService.getAll(),
      vacRes: this.vacancyService.getAll({ limit: 500 }),
      appRes: this.applicationService.getAll({ limit: 1000 }),
    }).subscribe({
      next: ({ deptRes, vacRes, appRes }) => {
        this.loadError = '';
        const depts: Department[] = Array.isArray(deptRes.data)
          ? deptRes.data
          : [];
        const vacs: Vacancy[] =
          (vacRes.data as any)?.items ?? vacRes.data ?? [];
        const apps: Application[] =
          (appRes.data as any)?.items ?? appRes.data ?? [];

        const openVacancies = vacs.filter(
          (v) => v.status === VacancyStatus.OPENED,
        ).length;
        const totalApplications = apps.length;
        const inProcess = apps.filter(
          (a) => !['Selected', 'Rejected'].includes(a.status),
        ).length;
        const selected = apps.filter((a) => a.status === 'Selected').length;

        this.stats = {
          totalApplications,
          openVacancies,
          hiringRate:
            totalApplications > 0
              ? Math.round((selected / totalApplications) * 100)
              : 0,
          applicantsInProcess: inProcess,
        };

        this.pipelineData[0].count = apps.filter(
          (a) => a.status === 'Pending',
        ).length;
        this.pipelineData[1].count = apps.filter(
          (a) => a.status === 'Screening',
        ).length;
        this.pipelineData[2].count = apps.filter(
          (a) => a.status === 'Interview Scheduled',
        ).length;
        this.pipelineData[3].count = apps.filter(
          (a) => a.status === 'Selected',
        ).length;
        this.pipelineData[4].count = apps.filter(
          (a) => a.status === 'Rejected',
        ).length;

        this.departmentData = depts
          .map((d) => ({
            name: d.name,
            vacancies: vacs.filter(
              (v) => String(v.departmentId) === String(d.id),
            ).length,
            applications: apps.filter(
              (a) => String(a.vacancy?.departmentId ?? '') === String(d.id),
            ).length,
          }))
          .filter((row) => row.vacancies > 0 || row.applications > 0);
      },
      error: () => {
        this.loadError = 'Failed to load reports (API / DB).';
      },
    });
  }

  get maxPipeline(): number {
    return Math.max(...this.pipelineData.map((p) => p.count), 1);
  }

  get maxDeptApps(): number {
    if (!this.departmentData.length) return 1;
    return Math.max(...this.departmentData.map((d) => d.applications), 1);
  }
}
