import { Routes } from '@angular/router';

// Import các thành phần của Khang (Dev 5)
import { ApplicantLayoutComponent } from './applicant-portal/layout/applicant-layout/applicant-layout';
import { CareersComponent } from './applicant-portal/pages/careers/careers';
import { DashboardComponent } from './applicant-portal/pages/dashboard/dashboard';
import { LoginComponent } from './applicant-portal/pages/login/login.component';
import { Page404Component } from './shared/components/page404/page404/page404.component';
import { loginGuard } from './core/guards/auth.guard';
import { VerifyPageComponent } from './applicant-portal/pages/verify-page/verify-page.component';

export const routes: Routes = [
  {
    path: 'hr-portal/login',
    component: LoginComponent,
    canActivate: [loginGuard],
    data: { portal: 'staff' },
  },
  // Tuyến đường cho HR Portal (Dev 4)
  {
    path: 'hr-portal',
    loadChildren: () =>
      import('./hr-portal/hr-portal.routes').then((m) => m.hrPortalRoutes),
  },

  // Tuyến đường cho Applicant Portal (Dev 5) - Bọc trong Layout chung
  {
    path: '',
    component: ApplicantLayoutComponent,
    children: [
      { path: 'careers', component: CareersComponent },
      { path: 'applicant', component: DashboardComponent },
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard],
        data: { portal: 'applicant' },
      },
      { path: 'verify-email', component: VerifyPageComponent },
      { path: '', redirectTo: 'careers', pathMatch: 'full' },
    ],
  },
  {
    path: '404',
    component: Page404Component,
  },
  // Nếu gõ sai đường dẫn, đá về trang chủ tuyển dụng
  { path: '**', redirectTo: '/404' },
];
