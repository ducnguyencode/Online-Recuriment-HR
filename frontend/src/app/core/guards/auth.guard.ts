import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && !auth.isApplicant()) {
    return true;
  }
  // DEV MODE: Auto-login vì Login page do Dev 5 xây dựng
  // Khi Dev 5 hoàn thành, sẽ chuyển sang redirect về /login
  // const autoLoggedIn = auth.mockLoginAsRole(auth.getDevRole() ?? UserRole.HR);
  // if (autoLoggedIn) {
  //   return true;
  // }

  // Production: redirect về login (do Dev 5 build)
  router.navigate(['/']);
  return false;
};

export const hrGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && (auth.isHR() || auth.isSuperadmin())) {
    return true;
  }
  router.navigate(['/hr-portal']);
  return false;
};

export const loginAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isApplicant()) {
    return router.navigate(['/']);
  }

  if (auth.isLoggedIn() && !auth.isApplicant()) {
    return router.navigate(['/hr-portal']);
  }
  return true;
};

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return router.navigate(['/']);
  }
  return true;
};
