import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // DEV MODE: Auto-login vì Login page do Dev 5 xây dựng
  // Khi Dev 5 hoàn thành, sẽ chuyển sang redirect về /login
  const autoLoggedIn = auth.mockLoginAsRole(auth.getDevRole() ?? 'HR');
  if (autoLoggedIn) {
    return true;
  }

  // Production: redirect về login (do Dev 5 build)
  // router.navigate(['/login']);
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
