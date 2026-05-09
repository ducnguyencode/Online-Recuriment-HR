import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const isLoginPage = (): boolean => {
    const url = router.url;
    return url.includes('/login') || url.includes('/forgot-password') || url.includes('/register');
  };

  const getLoginUrl = (): string => {
    const url = router.url;
    return url.includes('/hr') ? '/hr/login' : '/login';
  };

  const handleRequest = (request: any) => {
    if (token) {
      const cloned = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            localStorage.removeItem('hr_token');
            localStorage.removeItem('hr_user');
            localStorage.removeItem('hr_dev_role');
            auth.currentUser.set(null);
            // Don't redirect if already on a login page — let the component show the form error
            if (!isLoginPage()) {
              router.navigateByUrl(getLoginUrl());
            }
          }
          return throwError(() => error);
        }),
      );
    }
    return next(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Don't redirect if already on a login page — let the component show the form error
          if (!isLoginPage()) {
            router.navigateByUrl(getLoginUrl());
          }
        }
        return throwError(() => error);
      }),
    );
  };

  return handleRequest(req);
};
