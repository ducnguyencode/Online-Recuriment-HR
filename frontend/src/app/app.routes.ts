import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },

  // hr-portal là khu vực Dev 4 phụ trách
  {
    path: 'hr-portal',
    canActivate: [authGuard],
    loadChildren: () => import('./hr-portal/hr-portal.routes').then(m => m.hrPortalRoutes),
  },

  // careers, applicant sẽ do Dev 5 xây dựng
  // { path: 'careers', ... },
  // { path: 'applicant', ... },

  // Redirect mặc định
  { path: '', redirectTo: '/hr-portal', pathMatch: 'full' },
  { path: '**', redirectTo: '/hr-portal' },
];
