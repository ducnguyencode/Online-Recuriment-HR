import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  stats: any;

  pipelineData = [
    { label: 'Pending', count: 0, color: '#94A3B8' },
    { label: 'Screening', count: 0, color: '#F59E0B' },
    { label: 'Interviewing', count: 0, color: '#3B82F6' },
    { label: 'Selected', count: 0, color: '#22C55E' },
    { label: 'Rejected', count: 0, color: '#EF4444' },
  ];

  departmentData: { name: string; vacancies: number; applications: number }[] = [];

  constructor(private mockData: MockDataService) {
    this.stats = this.mockData.getDashboardStats();

    const apps = this.mockData.getApplications();
    this.pipelineData[0].count = apps.filter(a => a.status === 'Pending').length;
    this.pipelineData[1].count = apps.filter(a => a.status === 'Screening').length;
    this.pipelineData[2].count = apps.filter(a => a.status === 'Interview Scheduled').length;
    this.pipelineData[3].count = apps.filter(a => a.status === 'Selected').length;
    this.pipelineData[4].count = apps.filter(a => a.status === 'Rejected').length;

    const depts = this.mockData.getDepartments();
    const vacs = this.mockData.getVacancies();
    this.departmentData = depts.map(d => ({
      name: d.name,
      vacancies: vacs.filter(v => v.departmentId === d.id).length,
      applications: apps.filter(a => a.vacancy?.departmentId === d.id).length,
    })).filter(d => d.vacancies > 0 || d.applications > 0);
  }

  get maxPipeline(): number {
    return Math.max(...this.pipelineData.map(p => p.count), 1);
  }

  get maxDeptApps(): number {
    return Math.max(...this.departmentData.map(d => d.applications), 1);
  }
}
