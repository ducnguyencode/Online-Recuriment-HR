import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

// Import các thành phần của Khang (Dev 5)
import { ApplicantLayoutComponent } from './applicant-portal/layout/applicant-layout/applicant-layout';
import { CareersComponent } from './applicant-portal/pages/careers/careers';
import { DashboardComponent } from './applicant-portal/pages/dashboard/dashboard';
import { LoginComponent } from './applicant-portal/pages/login/login.component';

export const routes: Routes = [
  // Tuyến đường cho HR Portal (Dev 4)
  {
    path: 'hr-portal',
    canActivate: [authGuard],
    loadChildren: () => import('./hr-portal/hr-portal.routes').then(m => m.hrPortalRoutes),
  },

  // Tuyến đường cho Applicant Portal (Dev 5) - Bọc trong Layout chung
  {
    path: '',
    component: ApplicantLayoutComponent,
    children: [
      { path: 'careers', component: CareersComponent },
      { path: 'applicant', component: DashboardComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: LoginComponent },
      { path: 'forgot-password', component: LoginComponent },
      { path: '', redirectTo: 'careers', pathMatch: 'full' }
    ]
  },

  // Nếu gõ sai đường dẫn, đá về trang chủ tuyển dụng
  { path: '**', redirectTo: '/careers' }
];
