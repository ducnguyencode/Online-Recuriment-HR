import { Routes } from '@angular/router';
import { HrLayoutComponent } from './layout/hr-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { hrGuard, superadminGuard } from '../core/guards/auth.guard';

export const hrPortalRoutes: Routes = [
  {
    path: '',
    component: HrLayoutComponent,
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'vacancies',
        canActivate: [hrGuard],
        loadComponent: () => import('./vacancies/vacancy-list/vacancy-list.component').then(m => m.VacancyListComponent),
      },
      {
        path: 'applicants',
        canActivate: [hrGuard],
        loadComponent: () => import('./applicants/applicant-list/applicant-list.component').then(m => m.ApplicantListComponent),
      },
      {
        path: 'applications',
        canActivate: [hrGuard],
        loadComponent: () => import('./applications/application-list/application-list.component').then(m => m.ApplicationListComponent),
      },
      {
        path: 'interviews',
        loadComponent: () => import('./interviews/interview-list/interview-list.component').then(m => m.InterviewListComponent),
      },
      {
        path: 'favorite-jobs',
        canActivate: [hrGuard],
        loadComponent: () => import('./favorite-jobs/favorite-jobs.component').then(m => m.FavoriteJobsComponent),
      },
      {
        path: 'reports',
        canActivate: [hrGuard],
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent),
      },
      {
        path: 'audit',
        canActivate: [hrGuard],
        loadComponent: () => import('./audit-log/audit-log.component').then(m => m.AuditLogComponent),
      },
      {
        path: 'admin/staff',
        canActivate: [superadminGuard],
        loadComponent: () =>
          import('./admin/staff-management/staff-management.component').then(
            m => m.StaffManagementComponent,
          ),
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
