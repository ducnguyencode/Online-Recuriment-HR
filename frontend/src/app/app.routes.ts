import { Routes } from '@angular/router';
import { hrGuard } from './core/guards/auth.guard'; // Import your specific HR Guard

// --- APPLICANT PORTAL IMPORTS ---
import { LoginComponent } from './applicant-portal/pages/login/login.component';
import { ApplicantLayoutComponent } from './applicant-portal/layout/applicant-layout/applicant-layout';
import { CareersComponent } from './applicant-portal/pages/careers/careers';
import { DashboardComponent } from './applicant-portal/pages/dashboard/dashboard';
import { RegisterComponent } from './applicant-portal/pages/register/register.component';
import { ForgotPasswordComponent } from './applicant-portal/pages/forgot-password/forgot-password.component';

// --- HR PORTAL IMPORTS ---
import { HrLoginComponent } from './hr-portal/pages/hr-login/hr-login.component';

export const routes: Routes = [
  // Default route redirection
  {
    path: '',
    redirectTo: 'careers',
    pathMatch: 'full'
  },

  // === AUTHENTICATION ROUTES ===
  { path: 'login', component: LoginComponent },
  { path: 'login/hr', component: HrLoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // === APPLICANT PORTAL (PUBLIC) ===
  {
    path: '',
    component: ApplicantLayoutComponent,
    children: [
      { path: 'careers', component: CareersComponent },
      { path: 'applicant', component: DashboardComponent }
    ]
  },

  // === PROTECTED HR PORTAL (RESTRICTED) ===
  {
    path: 'hr-portal',
    component: DashboardComponent, // Temporary placeholder
    canActivate: [hrGuard] // Using hrGuard to protect the portal
  },

  // === FALLBACK ROUTE ===
  { path: '**', redirectTo: 'careers' }
];
