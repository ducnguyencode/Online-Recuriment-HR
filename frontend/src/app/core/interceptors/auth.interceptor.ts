import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

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
            router.navigateByUrl('/login');
          }
          return throwError(() => error);
        }),
      );
    }
    return next(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          router.navigateByUrl('/login');
        }
        return throwError(() => error);
      }),
    );
  };

  return handleRequest(req);
};
