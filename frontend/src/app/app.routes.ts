import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // hr-portal là khu vực Dev 4 phụ trách
  {
    path: 'hr-portal',
    canActivate: [authGuard],
    loadChildren: () => import('./hr-portal/hr-portal.routes').then(m => m.hrPortalRoutes),
  },

  // login, careers, applicant sẽ do Dev 5 xây dựng
  // { path: 'login', ... },
  // { path: 'careers', ... },
  // { path: 'applicant', ... },

  // Redirect mặc định
  { path: '', redirectTo: '/hr-portal', pathMatch: 'full' },
  { path: '**', redirectTo: '/hr-portal' },
];
