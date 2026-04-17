import { Routes } from '@angular/router';
import { HrLayoutComponent } from './layout/hr-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { hrGuard } from '../core/guards/auth.guard';

export const hrPortalRoutes: Routes = [
  {
    path: '',
    canActivate: [hrGuard],
    component: HrLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'vacancies',
        loadComponent: () => import('./vacancies/vacancy-list/vacancy-list.component').then(m => m.VacancyListComponent),
      },
      {
        path: 'applicants',
        loadComponent: () => import('./applicants/applicant-list/applicant-list.component').then(m => m.ApplicantListComponent),
      },
      {
        path: 'applications',
        loadComponent: () => import('./applications/application-list/application-list.component').then(m => m.ApplicationListComponent),
      },
      {
        path: 'applications/kanban',
        loadComponent: () => import('./applications/kanban-board/kanban-board.component').then(m => m.KanbanBoardComponent),
      },
      {
        path: 'interviews',
        loadComponent: () => import('./interviews/interview-list/interview-list.component').then(m => m.InterviewListComponent),
      },
      {
        path: 'favorite-jobs',

        loadComponent: () => import('./favorite-jobs/favorite-jobs.component').then(m => m.FavoriteJobsComponent),
      },
      {
        path: 'reports',

        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent),
      },
      {
        path: 'audit',

        loadComponent: () => import('./audit-log/audit-log.component').then(m => m.AuditLogComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/notifications.component').then(m => m.NotificationsComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: 'help',
        loadComponent: () => import('./help/help.component').then(m => m.HelpComponent),
      },
    ]
  }
];
