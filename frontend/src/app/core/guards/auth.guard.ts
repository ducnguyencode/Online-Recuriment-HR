import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Basic Auth Guard: Checks if the user is authenticated regardless of their role.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }

  // DEV MODE: Auto-login logic (Temporary while Login page is under development)
  const autoLoggedIn = auth.mockLoginAsRole(auth.getDevRole() ?? 'HR');
  if (autoLoggedIn) {
    return true;
  }

  // Production: Redirect to the main login page if not authenticated
  router.navigate(['/login']);
  return false;
};

/**
 * HR Guard: Ensures the user is logged in AND has HR or Superadmin privileges.
 */
export const hrGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in and belongs to HR or Superadmin groups
  if (auth.isLoggedIn() && (auth.isHR() || auth.isSuperadmin())) {
    return true;
  }

  // If unauthorized, redirect to HR login page (fixed logic)
  router.navigate(['/login/hr']);
  return false;
};

/**
 * Superadmin Guard: Restricts access to Superadmin users only.
 */
export const superadminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn() && auth.isSuperadmin()) {
    return true;
  }

  // Redirect to HR portal if the user is not a Superadmin
  router.navigate(['/hr-portal']);
  return false;
};
