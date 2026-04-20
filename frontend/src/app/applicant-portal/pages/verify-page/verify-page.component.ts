import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-page',
  imports: [],
  templateUrl: './verify-page.component.html',
  styleUrl: './verify-page.component.scss',
})
export class VerifyPageComponent {
  readonly title = signal('Verifying your email...');
  readonly description = signal(
    'Please wait while we validate your verification token.',
  );

  constructor(
    private router: Router,
    route: ActivatedRoute,
    authService: AuthService,
  ) {
    const token = route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.title.set('Verification token is missing');
      this.description.set('Open the verification link from your email again.');
      return;
    }

    authService.verifyEmail(token).subscribe({
      next: (res) => {
        this.title.set('Email verified');
        this.description.set(res.message);
      },
      error: (err) => {
        this.title.set('Verification failed');
        this.description.set(
          err.error?.message ?? 'The verification link is invalid.',
        );
      },
    });
  }

  returnLogin() {
    this.router.navigate(['/login']);
  }
}
