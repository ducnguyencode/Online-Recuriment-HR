import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DashboardService,
  RecruitmentReportDto,
} from '../../core/services/dasboard.service';

interface PipelineRow {
  label: string;
  status: string;
  count: number;
  color: string;
}

const PIPELINE_COLORS: Record<string, string> = {
  Pending: '#94A3B8',
  Interviewing: '#3B82F6',
  'Pending Review': '#F59E0B',
  Selected: '#22C55E',
  Rejected: '#EF4444',
};

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  loading = signal(false);
  totals = signal({
    totalApplications: 0,
    openVacancies: 0,
    hiringRate: 0,
    applicantsInProcess: 0,
  });
  pipelineData = signal<PipelineRow[]>([]);
  departmentData = signal<RecruitmentReportDto['departments']>([]);

  readonly maxPipeline = computed(() =>
    Math.max(...this.pipelineData().map((p) => p.count), 1),
  );
  readonly maxDeptApps = computed(() =>
    Math.max(
      ...this.departmentData().map((d) => Math.max(d.applications, d.vacancies)),
      1,
    ),
  );

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadReports();
  }

  private loadReports() {
    this.loading.set(true);
    this.dashboardService.recruitmentReports().subscribe({
      next: (res) => {
        const data = res.data;
        this.totals.set(data.totals);
        this.pipelineData.set(
          data.pipeline.map((row) => ({
            ...row,
            color: PIPELINE_COLORS[row.label] ?? '#94A3B8',
          })),
        );
        this.departmentData.set(data.departments);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
