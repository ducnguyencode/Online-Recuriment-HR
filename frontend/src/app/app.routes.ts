import { Routes } from '@angular/router';

// Import các thành phần của Khang (Dev 5)
import { ApplicantLayoutComponent } from './applicant-portal/layout/applicant-layout/applicant-layout';
import { CareersComponent } from './applicant-portal/pages/careers/careers';
import { DashboardComponent } from './applicant-portal/pages/dashboard/dashboard';
import { LoginComponent } from './applicant-portal/pages/login/login.component';
import { Page404Component } from './shared/components/page404/page404/page404.component';
import { VerifyPageComponent } from './applicant-portal/pages/verify-page/verify-page.component';

// Import các trang mới (Register, Forgot Pass, Profile)
import { RegisterComponent } from './applicant-portal/pages/register/register.component';
import { ForgotPasswordComponent } from './applicant-portal/pages/forgot-password/forgot-password.component';
import { ProfileComponent } from './applicant-portal/pages/profile/profile.component';

// Import Guards
import {
  loginGuard,
  authApplicantGuard,
  careersGuard,
} from './core/guards/auth.guard';

export const routes: Routes = [
  // --- Tuyến đường cho HR Portal (Dev 4) ---
  {
    path: 'hr-portal',
    loadChildren: () =>
      import('./hr-portal/hr-portal.routes').then((m) => m.hrPortalRoutes),
  },
  {
    path: 'set-initial-password',
    loadComponent: () =>
      import(
        './shared/components/set-initial-password/set-initial-password.component'
      ).then((m) => m.SetInitialPasswordComponent),
  },

  // --- Luồng Login cho HR ---
  {
    path: 'hr/login',
    component: LoginComponent,
    data: { role: 'HR' }
  },

  // --- Tuyến đường cho Applicant Portal (Dev 5) ---
  {
    path: '',
    component: ApplicantLayoutComponent,
    children: [
      { path: 'careers', component: CareersComponent, canActivate: [careersGuard] },

      // ĐÃ BẬT LẠI KHÓA CHO TRANG NỘI BỘ
      {
        path: 'applicant',
        component: DashboardComponent,
        canActivate: [authApplicantGuard]
      },
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [authApplicantGuard]
      },

      // ĐÃ BẬT LẠI GUARD CHẶN TRANG LOGIN
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [loginGuard],
        data: { role: 'Applicant' }
      },
      { path: 'register', component: RegisterComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'verify-email', component: VerifyPageComponent },

      { path: '', redirectTo: 'careers', pathMatch: 'full' },
    ],
  },

  // --- Các trang bổ trợ ---
  {
    path: '404',
    component: Page404Component,
  },

  // Nếu gõ sai đường dẫn, đá về trang 404
  { path: '**', redirectTo: '/404' },
];
